-- KiloLink database migration (up)
-- Apply this in Supabase SQL editor or via your migration runner.
-- This migration is idempotent where feasible.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  avatar_url text,
  phone text,
  country text,
  rating numeric(2,1) default 5.0,
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));
alter table profiles
  add column if not exists updated_at timestamptz not null default now();

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references auth.users(id) on delete cascade,
  origin text not null,
  destination text not null,
  departure_date date not null,
  airline text,
  kilos_available int not null,
  price_per_kg numeric(10,2) not null,
  accepted_items text,
  description text,
  status text not null default 'active' check (status in ('active', 'full', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table trips
  add column if not exists updated_at timestamptz not null default now();

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  kilos_requested int not null,
  parcel_description text not null,
  parcel_photo_url text,
  parcel_value numeric(10,2),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);
alter table bookings
  add column if not exists updated_at timestamptz not null default now();

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewed_user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table reviews
  add column if not exists updated_at timestamptz not null default now();

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null,
  commission numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  created_at timestamptz not null default now()
);
alter table payments
  add column if not exists updated_at timestamptz not null default now();

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'rejected')),
  created_at timestamptz not null default now()
);
alter table disputes
  add column if not exists updated_at timestamptz not null default now();

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table notifications
  add column if not exists updated_at timestamptz not null default now();

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_trip_sender_unique'
  ) then
    alter table bookings
      add constraint bookings_trip_sender_unique unique (trip_id, sender_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_booking_reviewer_unique'
  ) then
    alter table reviews
      add constraint reviews_booking_reviewer_unique unique (booking_id, reviewer_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trips_kilos_available_positive') then
    alter table trips
      add constraint trips_kilos_available_positive check (kilos_available > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'trips_price_per_kg_non_negative') then
    alter table trips
      add constraint trips_price_per_kg_non_negative check (price_per_kg >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_kilos_requested_positive') then
    alter table bookings
      add constraint bookings_kilos_requested_positive check (kilos_requested > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_parcel_value_non_negative') then
    alter table bookings
      add constraint bookings_parcel_value_non_negative check (parcel_value is null or parcel_value >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'payments_amount_non_negative') then
    alter table payments
      add constraint payments_amount_non_negative check (amount >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'payments_commission_non_negative') then
    alter table payments
      add constraint payments_commission_non_negative check (commission >= 0);
  end if;
end $$;

create index if not exists idx_trips_origin_destination on trips(origin, destination);
create index if not exists idx_trips_departure_date on trips(departure_date);
create index if not exists idx_bookings_trip_id on bookings(trip_id);
create index if not exists idx_bookings_sender_id on bookings(sender_id);
create index if not exists idx_messages_booking_created on messages(booking_id, created_at desc);
create index if not exists idx_notifications_user_read_created on notifications(user_id, read, created_at desc);
create index if not exists idx_reviews_reviewed_user on reviews(reviewed_user_id);

create or replace function is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    where p.user_id = p_user_id
      and p.role = 'admin'
  );
$$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row
execute function set_updated_at();

drop trigger if exists trg_trips_updated_at on trips;
create trigger trg_trips_updated_at
before update on trips
for each row
execute function set_updated_at();

drop trigger if exists trg_bookings_updated_at on bookings;
create trigger trg_bookings_updated_at
before update on bookings
for each row
execute function set_updated_at();

drop trigger if exists trg_reviews_updated_at on reviews;
create trigger trg_reviews_updated_at
before update on reviews
for each row
execute function set_updated_at();

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at
before update on payments
for each row
execute function set_updated_at();

drop trigger if exists trg_disputes_updated_at on disputes;
create trigger trg_disputes_updated_at
before update on disputes
for each row
execute function set_updated_at();

drop trigger if exists trg_notifications_updated_at on notifications;
create trigger trg_notifications_updated_at
before update on notifications
for each row
execute function set_updated_at();

create or replace function validate_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_traveler_id uuid;
  v_trip_status text;
  v_kilos_available int;
begin
  select t.traveler_id, t.status, t.kilos_available
  into v_traveler_id, v_trip_status, v_kilos_available
  from trips t
  where t.id = new.trip_id;

  if v_traveler_id is null then
    raise exception 'Trip not found';
  end if;

  if new.sender_id = v_traveler_id then
    raise exception 'Traveler cannot book own trip';
  end if;

  if v_trip_status <> 'active' then
    raise exception 'Trip is not active';
  end if;

  if new.kilos_requested > v_kilos_available then
    raise exception 'Requested kilos exceed available kilos';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_booking_insert on bookings;
create trigger trg_validate_booking_insert
before insert on bookings
for each row
execute function validate_booking_insert();

create or replace function recalculate_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles p
  set rating = coalesce((
    select round(avg(r.rating)::numeric, 1)
    from reviews r
    where r.reviewed_user_id = p.user_id
  ), 5.0)
  where p.user_id = coalesce(new.reviewed_user_id, old.reviewed_user_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_reviews_recalculate_rating on reviews;
create trigger trg_reviews_recalculate_rating
after insert or update or delete on reviews
for each row
execute function recalculate_profile_rating();

alter table profiles enable row level security;
alter table trips enable row level security;
alter table bookings enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table payments enable row level security;
alter table disputes enable row level security;
alter table notifications enable row level security;
alter table admin_logs enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;

drop policy if exists "trips_public_read" on trips;
drop policy if exists "trips_insert_own" on trips;
drop policy if exists "trips_update_own" on trips;

drop policy if exists "bookings_read_owner" on bookings;
drop policy if exists "bookings_insert_sender" on bookings;
drop policy if exists "bookings_update_owner" on bookings;

drop policy if exists "messages_read_participants" on messages;
drop policy if exists "messages_insert_sender" on messages;
drop policy if exists "reviews_read_participants" on reviews;
drop policy if exists "reviews_insert_participants" on reviews;
drop policy if exists "payments_read_participants" on payments;
drop policy if exists "payments_manage_admin" on payments;
drop policy if exists "disputes_read_participants_or_admin" on disputes;
drop policy if exists "disputes_insert_participants" on disputes;
drop policy if exists "disputes_update_admin" on disputes;
drop policy if exists "notifications_read_own" on notifications;
drop policy if exists "notifications_update_own" on notifications;
drop policy if exists "admin_logs_read_admin" on admin_logs;
drop policy if exists "admin_logs_insert_admin" on admin_logs;

create policy "profiles_select_own" on profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = user_id);

create policy "trips_public_read" on trips for select using (true);
create policy "trips_insert_own" on trips for insert with check (auth.uid() = traveler_id);
create policy "trips_update_own" on trips for update using (auth.uid() = traveler_id);

create policy "bookings_read_owner" on bookings
for select
using (
  auth.uid() = sender_id
  or exists (
    select 1 from trips t
    where t.id = trip_id and t.traveler_id = auth.uid()
  )
);
create policy "bookings_insert_sender" on bookings for insert with check (auth.uid() = sender_id);
create policy "bookings_update_owner" on bookings
for update
using (
  auth.uid() = sender_id
  or exists (
    select 1
    from trips t
    where t.id = trip_id
      and t.traveler_id = auth.uid()
  )
)
with check (
  auth.uid() = sender_id
  or exists (
    select 1
    from trips t
    where t.id = trip_id
      and t.traveler_id = auth.uid()
  )
);

create policy "messages_read_participants" on messages
for select
using (
  exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id and (b.sender_id = auth.uid() or t.traveler_id = auth.uid())
  )
);
create policy "messages_insert_sender" on messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id
      and (b.sender_id = auth.uid() or t.traveler_id = auth.uid())
  )
);

create policy "reviews_read_participants" on reviews
for select
using (
  auth.uid() = reviewer_id
  or auth.uid() = reviewed_user_id
  or exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
  or exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id
      and t.traveler_id = auth.uid()
  )
);

create policy "reviews_insert_participants" on reviews
for insert
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id
      and (
        (b.sender_id = auth.uid() and reviewed_user_id = t.traveler_id)
        or (t.traveler_id = auth.uid() and reviewed_user_id = b.sender_id)
      )
      and b.status = 'completed'
  )
);

create policy "payments_read_participants" on payments
for select
using (
  exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
  or exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id
      and t.traveler_id = auth.uid()
  )
);

create policy "payments_manage_admin" on payments
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "disputes_read_participants_or_admin" on disputes
for select
using (
  opened_by = auth.uid()
  or is_admin(auth.uid())
  or exists (
    select 1
    from bookings b
    where b.id = booking_id
      and b.sender_id = auth.uid()
  )
  or exists (
    select 1
    from bookings b
    join trips t on t.id = b.trip_id
    where b.id = booking_id
      and t.traveler_id = auth.uid()
  )
);

create policy "disputes_insert_participants" on disputes
for insert
with check (
  opened_by = auth.uid()
  and (
    exists (
      select 1
      from bookings b
      where b.id = booking_id
        and b.sender_id = auth.uid()
    )
    or exists (
      select 1
      from bookings b
      join trips t on t.id = b.trip_id
      where b.id = booking_id
        and t.traveler_id = auth.uid()
    )
  )
);

create policy "disputes_update_admin" on disputes
for update
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "notifications_read_own" on notifications
for select
using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admin_logs_read_admin" on admin_logs
for select
using (is_admin(auth.uid()));

create policy "admin_logs_insert_admin" on admin_logs
for insert
with check (is_admin(auth.uid()));

-- Promote an account to admin (run manually with a known user UUID)
-- update profiles set role = 'admin' where user_id = 'YOUR_USER_UUID';
