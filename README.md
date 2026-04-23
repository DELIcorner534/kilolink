# KiloLink

Plateforme web premium de transport de colis diaspora (Belgique ⇄ Afrique), construite avec:

- Next.js + TypeScript + Tailwind
- Supabase + PostgreSQL
- Stripe

## Lancer en local

1. Copier `.env.example` vers `.env.local`
2. Renseigner les cles Supabase/Stripe/Resend
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
- `docs/DELIVERY_PLAN.md`: devis, planning, recommandations

## Prochaines etapes techniques

- Brancher Supabase Auth et RLS
- Connecter formulaires aux vraies tables PostgreSQL
- Ajouter webhooks Stripe pour validation des paiements
- Ajouter envoi d'emails transactionnels avec Resend
