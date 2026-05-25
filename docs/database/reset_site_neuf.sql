-- RESET SITE NEUF (Supabase)
-- But: supprimer les comptes membres et toutes les donnees metier liees.
-- Important: les comptes admin sont conserves.
--
-- A executer dans Supabase SQL Editor.
-- Cette operation est destructive.

begin;

-- 1) Vider d'abord les tables metier pour repartir proprement.
truncate table
  admin_logs,
  notifications,
  disputes,
  payments,
  reviews,
  messages,
  bookings,
  trips
restart identity cascade;

-- 2) Supprimer les users auth membres (non-admin).
-- On supprime d'abord dans auth.users; le profil lie sera efface par cascade.
delete from auth.users u
where exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
    and p.role <> 'admin'
);

-- 3) Supprimer aussi les users auth sans profil (comptes incomplets), sauf les admins marques.
delete from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.user_id = u.id
)
and coalesce(u.raw_user_meta_data->>'role', 'user') <> 'admin';

commit;

-- Verification rapide:
-- select count(*) as users_total from auth.users;
-- select role, count(*) from public.profiles group by role;
-- select count(*) as trips_total from public.trips;
