-- ============================================================================
-- KiloLink — Système de parrainage (referrals)
-- ============================================================================
-- Récompense : -5 % sur la prochaine réservation pour le parrain ET le filleul
-- Déclencheur : 1ère réservation payée du filleul
-- ============================================================================

-- 1. Colonnes parrainage sur profiles
alter table profiles
  add column if not exists referral_code text unique;
alter table profiles
  add column if not exists referred_by uuid references profiles(id) on delete set null;
alter table profiles
  add column if not exists referred_at timestamptz;

create index if not exists idx_profiles_referral_code on profiles (referral_code);
create index if not exists idx_profiles_referred_by on profiles (referred_by);

-- 2. Génération automatique d'un code parrain à la création d'un profile
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
  v_attempts int := 0;
begin
  loop
    -- KL- + 6 caractères alphanumériques (sans 0/O/1/I pour éviter les confusions)
    v_code := 'KL-' || upper(substr(translate(encode(gen_random_bytes(8), 'base64'),
                                              '0OI1l+/=', 'ABCDEFGH'), 1, 6));
    select exists(select 1 from profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Impossible de générer un code parrain unique';
    end if;
  end loop;
  return v_code;
end;
$$;

create or replace function set_referral_code_on_profile()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := generate_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_referral_code on profiles;
create trigger trg_profiles_set_referral_code
  before insert on profiles
  for each row execute function set_referral_code_on_profile();

-- Backfill : générer un code pour les profils existants qui n'en ont pas
update profiles
   set referral_code = generate_referral_code()
 where referral_code is null;

-- 3. Table des récompenses de parrainage
create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('referrer', 'referee')),
  triggered_by_booking uuid references bookings(id) on delete set null,
  related_user_id uuid references auth.users(id) on delete set null,
  discount_percent int not null default 5 check (discount_percent between 1 and 100),
  status text not null default 'pending' check (status in ('pending', 'used', 'expired')),
  used_on_booking uuid references bookings(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '6 months'),
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_rewards_recipient_status
  on referral_rewards (recipient_id, status);
create index if not exists idx_referral_rewards_triggered_booking
  on referral_rewards (triggered_by_booking);

-- 4. Colonnes discount sur bookings
alter table bookings
  add column if not exists original_amount numeric(10,2);
alter table bookings
  add column if not exists discount_percent int not null default 0 check (discount_percent between 0 and 100);
alter table bookings
  add column if not exists discount_reward_id uuid references referral_rewards(id) on delete set null;
alter table bookings
  add column if not exists final_amount numeric(10,2);

-- 5. Trigger : à la 1ère réservation PAYÉE du filleul, créer les 2 rewards
create or replace function grant_referral_rewards_on_payment()
returns trigger
language plpgsql
as $$
declare
  v_booking bookings%rowtype;
  v_sender_profile profiles%rowtype;
  v_referrer_profile profiles%rowtype;
  v_already_rewarded boolean;
begin
  -- Seul un passage vers 'paid' nous intéresse
  if new.status <> 'paid' or (old.status is not distinct from 'paid') then
    return new;
  end if;

  -- Récupérer la réservation associée
  select * into v_booking from bookings where id = new.booking_id;
  if not found then
    return new;
  end if;

  -- Profile du filleul (sender de la réservation)
  select * into v_sender_profile
    from profiles where user_id = v_booking.sender_id;
  if not found or v_sender_profile.referred_by is null then
    return new;
  end if;

  -- Vérifier que ce filleul n'a jamais déclenché de récompense de parrainage
  select exists(
    select 1 from referral_rewards
     where related_user_id = v_booking.sender_id
       and role = 'referrer'
  ) into v_already_rewarded;

  if v_already_rewarded then
    return new;
  end if;

  -- Récupérer le profil du parrain
  select * into v_referrer_profile
    from profiles where id = v_sender_profile.referred_by;
  if not found then
    return new;
  end if;

  -- Créer la récompense pour le parrain
  insert into referral_rewards (recipient_id, role, triggered_by_booking, related_user_id, discount_percent)
    values (v_referrer_profile.user_id, 'referrer', v_booking.id, v_booking.sender_id, 5);

  -- Créer la récompense pour le filleul
  insert into referral_rewards (recipient_id, role, triggered_by_booking, related_user_id, discount_percent)
    values (v_booking.sender_id, 'referee', v_booking.id, v_referrer_profile.user_id, 5);

  -- Notifications
  insert into notifications (user_id, type, title, payload)
    values (
      v_referrer_profile.user_id,
      'referral_rewarded',
      'Votre filleul a fait son 1er envoi !',
      jsonb_build_object('discount_percent', 5, 'booking_id', v_booking.id)
    );
  insert into notifications (user_id, type, title, payload)
    values (
      v_booking.sender_id,
      'referral_rewarded',
      'Bravo, -5 % offerts sur votre prochain envoi',
      jsonb_build_object('discount_percent', 5, 'booking_id', v_booking.id)
    );

  return new;
end;
$$;

drop trigger if exists trg_payments_grant_referral on payments;
create trigger trg_payments_grant_referral
  after update on payments
  for each row execute function grant_referral_rewards_on_payment();

-- 6. Fonction utilitaire : récupérer la meilleure récompense disponible
create or replace function get_best_available_reward(p_user_id uuid)
returns referral_rewards
language sql
stable
as $$
  select *
    from referral_rewards
   where recipient_id = p_user_id
     and status = 'pending'
     and expires_at > now()
   order by created_at asc
   limit 1;
$$;

-- 7. Fonction transactionnelle : appliquer une récompense à une réservation
create or replace function apply_reward_to_booking(p_booking_id uuid)
returns referral_rewards
language plpgsql
security definer
as $$
declare
  v_booking bookings%rowtype;
  v_reward referral_rewards%rowtype;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Réservation introuvable';
  end if;

  if v_booking.discount_reward_id is not null then
    -- déjà appliquée
    select * into v_reward from referral_rewards where id = v_booking.discount_reward_id;
    return v_reward;
  end if;

  select * into v_reward
    from referral_rewards
   where recipient_id = v_booking.sender_id
     and status = 'pending'
     and expires_at > now()
   order by created_at asc
   limit 1
   for update;

  if not found then
    return null;
  end if;

  update referral_rewards
     set status = 'used',
         used_on_booking = p_booking_id,
         used_at = now()
   where id = v_reward.id;

  update bookings
     set discount_reward_id = v_reward.id,
         discount_percent = v_reward.discount_percent
   where id = p_booking_id;

  return v_reward;
end;
$$;

grant execute on function apply_reward_to_booking(uuid) to authenticated;

-- 8. Trouver un profil par code parrain (utilisable même non connecté côté UI app via RPC)
create or replace function find_profile_by_referral_code(p_code text)
returns table (id uuid, user_id uuid, full_name text)
language sql
stable
security definer
as $$
  select id, user_id, full_name
    from profiles
   where upper(referral_code) = upper(p_code)
   limit 1;
$$;

grant execute on function find_profile_by_referral_code(text) to anon, authenticated;

-- 9. RLS sur referral_rewards
alter table referral_rewards enable row level security;

drop policy if exists "users can read own rewards" on referral_rewards;
create policy "users can read own rewards"
  on referral_rewards for select
  using (auth.uid() = recipient_id);

-- Pas de policy insert/update/delete : tout passe par triggers / fonctions security definer

-- 10. Nettoyage périodique optionnel (à appeler via cron) : marquer les rewards expirés
create or replace function expire_old_rewards()
returns int
language sql
as $$
  with updated as (
    update referral_rewards
       set status = 'expired'
     where status = 'pending'
       and expires_at < now()
    returning 1
  )
  select count(*)::int from updated;
$$;
