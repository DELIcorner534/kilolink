-- FAQ content table for production-managed help content
-- Run after schema.sql (depends on is_admin function).

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faqs_published_position on faqs (is_published, position, created_at desc);

drop trigger if exists trg_faqs_updated_at on faqs;
create trigger trg_faqs_updated_at
before update on faqs
for each row
execute function set_updated_at();

alter table faqs enable row level security;

drop policy if exists "faqs_public_read_published" on faqs;
drop policy if exists "faqs_admin_manage" on faqs;

create policy "faqs_public_read_published" on faqs
for select
using (is_published = true);

create policy "faqs_admin_manage" on faqs
for all
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

-- Optional starter content (neutral, non-marketing placeholders):
insert into faqs (question, answer, position, is_published)
values
  ('Comment reserver un trajet ?', 'Ouvrez un trajet, indiquez les kilos de votre colis puis envoyez la demande.', 10, true),
  ('Quand le paiement est-il valide ?', 'Le paiement est confirme quand la transaction Stripe est finalisee et le statut passe a paid.', 20, true),
  ('Comment contacter le support ?', 'Utilisez la page Contact pour toute demande et incluez l ID de reservation si possible.', 30, true)
on conflict do nothing;
