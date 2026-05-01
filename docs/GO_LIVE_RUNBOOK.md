# KiloLink - Go Live Runbook

Suivre cette liste dans l'ordre. Quand un point est termine, cocher et passer au suivant.

## 1) Variables d'environnement

- [ ] Creer `.env.local` a partir de `.env.example`.
- [ ] Renseigner:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

## 2) Base de donnees Supabase

- [ ] Executer `docs/database/schema.sql`.
- [ ] Executer `docs/database/migration_phase_complete.sql`.
- [ ] Verifier RLS/policies (attendu: 22 policies sur les 9 tables principales).
- [ ] Activer Realtime sur `public.messages`.

## 3) Stripe

- [ ] Verifier `STRIPE_SECRET_KEY` (test ou live selon environnement).
- [ ] Creer webhook Stripe:
  - URL: `https://ton-domaine.com/api/stripe/webhook`
  - Event: `checkout.session.completed`
- [ ] Copier la signature webhook dans `STRIPE_WEBHOOK_SECRET`.

## 4) Verification technique locale

- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] Ouvrir `/`, `/search`, `/publish-trip`, `/dashboard`, `/messages`, `/booking/new`.

## 5) Test metier complet (2 comptes)

- [ ] Compte A publie un trajet.
- [ ] Compte B reserve ce trajet.
- [ ] Compte A accepte la reservation.
- [ ] Compte B paie via Stripe checkout.
- [ ] Payment passe `paid` dans la table `payments`.
- [ ] L'un des comptes marque la reservation `completed`.
- [ ] L'autre compte laisse un avis, et `profiles.rating` se met a jour.

## 6) Verification admin

- [ ] Donner role admin:
  - `update profiles set role = 'admin' where user_id = '<ADMIN_UUID>';`
- [ ] Ouvrir `/dashboard/admin` et verifier les stats.

## 7) Deploiement prod

- [ ] Deployer sur Vercel.
- [ ] Configurer les variables d'environnement dans Vercel (Production).
- [ ] Verifier que `NEXT_PUBLIC_APP_URL` pointe sur le domaine final.
- [ ] Rejouer le test metier complet sur la prod.

## 8) Post go-live (recommande)

- [ ] Activer monitoring erreurs (Sentry ou logs Vercel).
- [ ] Ajouter webhook `checkout.session.expired` pour marquer les paiements annules/expirés.
- [ ] Mettre en place une routine de sauvegarde DB (si plan Supabase requis).
