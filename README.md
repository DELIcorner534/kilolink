# KiloLink

Plateforme web premium de transport de colis diaspora (Belgique ⇄ Afrique), construite avec:

- Next.js + TypeScript + Tailwind
- Supabase + PostgreSQL
- Stripe

## Lancer en local

1. Copier `.env.example` vers `.env.local`
2. Renseigner les cles Supabase/Stripe
3. Executer:

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## Structure principale

- `src/app`: pages publiques, auth, dashboard membre, admin
- `src/components`: composants UI reutilisables
- `src/lib`: types, data mocks, clients Supabase/Stripe
- `docs/database/schema.sql`: schema SQL de base
- `docs/database/migration_phase_complete.sql`: migration SQL complementaire
- `docs/GO_LIVE_RUNBOOK.md`: checklist finale de mise en production

## Configuration externe obligatoire

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Verification rapide avant prod

1. Executer `docs/database/migration_phase_complete.sql` dans Supabase SQL editor.
2. Activer Realtime sur la table `messages`.
3. Configurer le webhook Stripe vers `/api/stripe/webhook`.
4. Lancer:

```bash
npm run build
```

5. Valider le parcours metier complet:
   - publier trajet -> reserver -> accepter -> payer -> marquer terminee -> laisser avis.
