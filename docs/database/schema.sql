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
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  kilos_requested int not null,
  parcel_description text not null,
  parcel_photo_url text,
  parcel_value numeric(10,2),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

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

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null,
  commission numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

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

drop policy if exists "messages_read_participants" on messages;
drop policy if exists "messages_insert_sender" on messages;

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
create policy "messages_insert_sender" on messages for insert with check (auth.uid() = sender_id);

-- Promote an account to admin (run manually with a known user UUID)
-- update profiles set role = 'admin' where user_id = 'YOUR_USER_UUID';
