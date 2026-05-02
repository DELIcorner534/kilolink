-- KiloLink: reserve kilos on booking insert; release on pending reject/cancel.
-- Run in Supabase SQL Editor if you already applied an older migration_phase_complete.sql.
-- Idempotent: replaces functions and recreates triggers.

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
