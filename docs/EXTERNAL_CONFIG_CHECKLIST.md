# KiloLink - Configuration Externe et Go-Live

Objectif: deploiement stable sous 48h avec auth, trajets, reservations, messagerie temps reel et paiement Stripe.

## 1) Variables d'environnement (Production)

A configurer dans Vercel (Project Settings -> Environment Variables):

- `NEXT_PUBLIC_APP_URL=https://ton-domaine.com`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `STRIPE_SECRET_KEY=sk_live_...` (ou `sk_test_...` en preprod)
- `RESEND_API_KEY=...` (si emails transactionnels actives)

Conseils:

- Ne jamais exposer de cle privee Stripe cote client.
- `NEXT_PUBLIC_*` est visible dans le front, donc uniquement des cles publiques.
- Utiliser des valeurs distinctes pour Preview et Production.

## 2) Supabase (obligatoire)

## 2.1 Base de donnees

- Executer le schema SQL: `docs/database/schema.sql`.
- Verifier que les policies RLS sont bien actives.

## 2.2 Auth

- Auth Providers: Email/Password active.
- URL de site: `https://ton-domaine.com`
- Redirect URLs:
  - `https://ton-domaine.com/auth/sign-in`
  - `https://ton-domaine.com/auth/forgot-password`
  - `https://ton-domaine.com/dashboard`

## 2.3 Realtime

- Activer Realtime sur la table `messages`.
- Verifier que les policies permettent lecture/ecriture aux participants autorises.

## 3) Stripe (obligatoire pour paiements)

## 3.1 Cles

- Copier la secret key dans `STRIPE_SECRET_KEY`.

## 3.2 Webhook recommande (fortement)

Le projet fonctionne deja avec checkout, mais pour un go-live solide il faut ajouter un webhook Stripe:

- Endpoint a creer (exemple): `/api/stripe/webhook`
- Evenements minimum:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

But:

- Synchroniser le statut de paiement dans la table `payments`.
- Eviter les desynchronisations si l'utilisateur ferme la page apres paiement.

## 4) Vercel (deployment)

- Framework detecte: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output: automatique Next.js
- Node runtime: version stable LTS (20+)

## 5) Tests minimum avant go-live

## 5.1 Techniques

- `npm run lint`
- `npm run build`
- Ouvrir les routes principales:
  - `/`, `/search`, `/publish-trip`, `/booking/new`, `/messages`
  - `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`
  - `/dashboard`, `/dashboard/admin`, `/faq`, `/contact`, `/terms`, `/privacy`

## 5.2 Parcours metier (manuel)

- Inscription -> connexion -> dashboard.
- Publication trajet -> recherche trajet -> reservation.
- Message temps reel sur booking existant.
- Checkout Stripe en mode test.

## 6) Serveur hybride: necessaire ou non?

Reponse courte: **non, pas obligatoire** pour ton use case actuel.

Architecture recommande:

- Front + routes serveur: Next.js (Vercel serverless)
- Data + auth + realtime: Supabase
- Paiement: Stripe + webhook

Pourquoi c'est suffisant:

- Ajout de trajets/reservations: gere par Supabase et Server Actions.
- Temps reel messagerie: gere par Supabase Realtime.
- Paiements: gere par Stripe API + webhook.

Quand envisager un vrai serveur hybride dedie:

- Tres gros volume temps reel (beaucoup de rooms simultanees).
- Workers longs (matching complexe, files de taches, antifraude avancee).
- Integrations backend lourdes non adaptees aux fonctions serverless.

## 7) Risques restants a corriger vite (avant prod)

- `dashboard/admin` est protege par login, mais pas encore par role admin strict.
- Le webhook Stripe n'est pas encore branche dans le repo.
- Prevoir monitoring (Sentry/Logs Vercel) pour les erreurs runtime.
