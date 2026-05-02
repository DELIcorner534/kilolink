-- KiloLink: one-shot migration for "phase complete" app logic (run after prior migrations).
-- Safe to re-run where guarded by IF NOT EXISTS / DROP IF EXISTS patterns.

alter table payments add column if not exists stripe_checkout_session_id text unique;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'trips_kilos_available_positive') then
    alter table trips drop constraint trips_kilos_available_positive;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trips_kilos_available_non_negative') then
    alter table trips add constraint trips_kilos_available_non_negative check (kilos_available >= 0);
  end if;
end $$;

create or replace function reserve_kilos_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avail int;
begin
  if new.status is distinct from 'pending' then
    return new;
  end if;

  select t.kilos_available into v_avail from trips t where t.id = new.trip_id for update;
  if v_avail is null then
    raise exception 'Trip not found';
  end if;
  if v_avail < new.kilos_requested then
    raise exception 'Not enough kilos available';
  end if;

  update trips t
  set kilos_available = v_avail - new.kilos_requested,
      status = case
        when v_avail - new.kilos_requested <= 0 then 'full'
        else t.status
      end
  where t.id = new.trip_id;

  return new;
end;
$$;

drop trigger if exists trg_reserve_kilos_on_booking_insert on bookings;
create trigger trg_reserve_kilos_on_booking_insert
after insert on bookings
for each row
execute function reserve_kilos_on_booking_insert();

create or replace function apply_booking_status_kilos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' or old.status is not distinct from new.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('rejected', 'cancelled') then
    update trips t
    set kilos_available = t.kilos_available + old.kilos_requested,
        status = case
          when t.status = 'full' and t.kilos_available + old.kilos_requested > 0 then 'active'
          else t.status
        end
    where t.id = old.trip_id;
    return new;
  end if;

  if old.status = 'accepted' and new.status in ('cancelled', 'rejected') then
    update trips t
    set kilos_available = t.kilos_available + old.kilos_requested,
        status = case
          when t.status = 'full' and t.kilos_available + old.kilos_requested > 0 then 'active'
          else t.status
        end
    where t.id = old.trip_id;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_booking_status_kilos on bookings;
create trigger trg_apply_booking_status_kilos
after update of status on bookings
for each row
execute function apply_booking_status_kilos();

create or replace function notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_traveler_id uuid;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  select t.traveler_id into v_traveler_id from trips t where t.id = new.trip_id;

  if new.status = 'accepted' and v_traveler_id is not null then
    insert into notifications (user_id, type, title, payload)
    values (
      new.sender_id,
      'booking',
      'Reservation acceptee',
      jsonb_build_object('booking_id', new.id, 'status', new.status)
    );
  elsif new.status = 'rejected' then
    insert into notifications (user_id, type, title, payload)
    values (
      new.sender_id,
      'booking',
      'Reservation refusee',
      jsonb_build_object('booking_id', new.id, 'status', new.status)
    );
  elsif new.status = 'cancelled' and v_traveler_id is not null then
    insert into notifications (user_id, type, title, payload)
    values (
      v_traveler_id,
      'booking',
      'Reservation annulee par expediteur',
      jsonb_build_object('booking_id', new.id, 'status', new.status)
    );
  elsif new.status = 'completed' and v_traveler_id is not null then
    insert into notifications (user_id, type, title, payload)
    values (
      v_traveler_id,
      'booking',
      'Reservation terminee',
      jsonb_build_object('booking_id', new.id, 'status', new.status)
    );
    insert into notifications (user_id, type, title, payload)
    values (
      new.sender_id,
      'booking',
      'Reservation terminee',
      jsonb_build_object('booking_id', new.id, 'status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_status on bookings;
create trigger trg_notify_booking_status
after update of status on bookings
for each row
execute function notify_booking_status_change();

drop policy if exists "profiles_read_travelers_with_listings" on profiles;
create policy "profiles_read_travelers_with_listings" on profiles for select using (
  exists (
    select 1
    from trips t
    where t.traveler_id = profiles.user_id
      and t.status in ('active', 'full')
  )
);

drop policy if exists "payments_insert_sender" on payments;
drop policy if exists "payments_update_sender" on payments;

create policy "payments_insert_sender" on payments
for insert
with check (
  exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
);

create policy "payments_update_sender" on payments
for update
using (
  exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
);
