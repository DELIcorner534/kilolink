# KiloLink - Plan de test complet (pre-deploiement)

Objectif: verifier rapidement tout le site avant mise en production, avec un resultat attendu clair et une action corrective immediate si un test echoue.

---

## 0) Preparation

### 0.1 Prerequis

- Node.js installe (version LTS recommandee)
- Dependances installees (`npm install`)
- Variables configurees dans `.env.local`:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `STRIPE_SECRET_KEY`
  - (optionnel) `RESEND_API_KEY`

### 0.2 Commandes de verification technique

1. `npm run lint`
2. `npm run build`
3. `npm run start`

### Resultat attendu

- `lint` sans erreur
- `build` sans erreur
- serveur pret sur `http://localhost:3000`

### Si ca echoue

- **Erreur env**: verifier les variables manquantes dans `.env.local`
- **Erreur TS/ESLint**: corriger les fichiers signales
- **Port 3000 occupe**: tuer le process puis relancer `npm run start`

---

## 1) Test UI global (style / CSS / lisibilite)

### Etapes

1. Ouvrir `/`
2. Ouvrir `/contact`, `/faq`, `/search`
3. Verifier header, footer, boutons bleus

### Resultat attendu

- Le site est style (pas en HTML brut)
- Les boutons bleus ont texte blanc lisible (`Espace membre`, `Reserver`, etc.)
- Aucun bloc blanc vide a la place du texte bouton

### Si ca echoue

- **Page sans style**: hard refresh `Ctrl + F5`
- **Toujours sans style**: verifier que le CSS `/_next/static/css/...` repond `200`
- **Texte illisible sur fond bleu**: forcer contraste (`!text-white`) sur les boutons concernes

---

## 2) Test routes publiques

### Routes

- `/`
- `/search`
- `/contact`
- `/faq`
- `/terms`
- `/privacy`

### Resultat attendu

- Chaque page charge en `200`
- Aucun crash serveur
- Contenu principal visible

### Si ca echoue

- **404**: verifier le fichier `page.tsx` de la route
- **500**: lire la stack serveur et corriger la logique (souvent env ou requete DB)

---

## 3) Test auth (inscription / connexion / reset)

### 3.1 Inscription

Etapes:

1. Aller sur `/auth/sign-up`
2. Remplir nom, email, mot de passe
3. Soumettre

Resultat attendu:

- Redirection vers `/dashboard` (ou session active)
- Utilisateur cree dans Supabase Auth

Si ca echoue:

- Verifier Supabase URL/Anon key
- Verifier provider Email actif dans Supabase Auth

### 3.2 Connexion

Etapes:

1. Aller sur `/auth/sign-in`
2. Entrer un compte valide
3. Soumettre

Resultat attendu:

- Redirection vers `/dashboard`
- Bouton/session connecte visible

Si ca echoue:

- Message erreur auth: verifier credentials
- Session non gardee: verifier cookies/auth proxy

### 3.3 Mot de passe oublie

Etapes:

1. Aller sur `/auth/forgot-password`
2. Entrer email
3. Soumettre

Resultat attendu:

- Message succes d'envoi d'email

Si ca echoue:

- Verifier `NEXT_PUBLIC_APP_URL`
- Verifier URL de redirection auth dans Supabase Dashboard

---

## 4) Test routes protegees

### Routes

- `/dashboard`
- `/messages`
- `/dashboard/admin`

### Resultat attendu

- Non connecte: redirection vers `/auth/sign-in`
- Connecte: acces autorise (au moins dashboard/messages)

### Si ca echoue

- Si non connecte mais acces autorise: manque de guard server-side
- Si connecte mais bloque: verifier session/cookies Supabase

---

## 5) Test publication trajet

### Etapes

1. Se connecter
2. Aller sur `/publish-trip`
3. Remplir formulaire trajet
4. Soumettre

### Resultat attendu

- Redirection vers `/dashboard?success=trip`
- Nouveau trajet visible via `/search`

### Si ca echoue

- Verifier table `trips` existe et colonnes correctes
- Verifier policy RLS insert sur `trips`

---

## 6) Test recherche trajet

### Etapes

1. Aller sur `/search`
2. Filtrer origine/destination/date
3. Appliquer

### Resultat attendu

- Liste de trajets coherente
- Si aucun resultat: message "Aucun trajet trouve..."

### Si ca echoue

- Verifier query supabase et noms colonnes
- Verifier permissions select (`trips_public_read`)

---

## 7) Test reservation

### Etapes

1. Depuis une carte trajet, cliquer `Reserver`
2. Sur `/booking/new`, remplir formulaire
3. Soumettre

### Resultat attendu

- Redirection vers `/messages?bookingId=...&success=booking`
- Booking cree dans table `bookings`

### Si ca echoue

- Verifier table `bookings` et foreign key `trip_id`
- Verifier policy insert `bookings_insert_sender`

---

## 8) Test messagerie temps reel

### Etapes

1. Ouvrir `/messages` avec une reservation existante
2. Envoyer un message
3. Observer l'apparition en direct

### Resultat attendu

- Message insere en DB
- Message visible instantanement dans la conversation

### Si ca echoue

- Verifier Realtime active sur `messages`
- Verifier policies select/insert `messages`
- Verifier connectivite client Supabase browser

---

## 9) Test paiement Stripe

### Etapes

1. Sur `/booking/new`, section paiement
2. Renseigner `Booking ID` + montant
3. Cliquer `Payer maintenant`

### Resultat attendu

- Creation session Stripe checkout
- Redirection vers page Stripe

### Si ca echoue

- `401`: utilisateur non connecte (normal)
- `503`: config Supabase manquante
- `500`: verifier `STRIPE_SECRET_KEY` et logs API

---

## 10) Test securite minimale

### A verifier

- Pages protegees inaccessible sans login
- API checkout refuse sans session
- Pas de secret expose dans le front

### Si ca echoue

- Ajouter/verifier guards server-side
- Controler variables `NEXT_PUBLIC_*` (jamais de secret prive)

---

## 11) Test de non-regression visuelle rapide

### Zones critiques

- Header (bouton `Espace membre`)
- Cards trajet (bouton `Reserver`)
- CTA final home (`Creer un compte`)
- Footer / formulaires contact/auth

### Resultat attendu

- Contraste lisible partout
- Pas de bouton vide
- Pas de texte noir sur fond bleu fonce

### Si ca echoue

- Uniformiser classes des CTA (`!text-white` sur fond bleu)
- Verifier surcharge CSS globale

---

## 12) Go / No-Go deploiement

## GO si:

- Build OK
- Tous tests critiques 1 a 10 OK
- Parcours complet "inscription -> trajet -> reservation -> message -> paiement" valide

## NO-GO si:

- CSS cassée
- auth instable
- paiement non fonctionnel
- erreurs serveur non resolues

---

## 13) Suivi des anomalies (modele)

Pour chaque bug detecte:

- ID:
- Page/route:
- Etape:
- Resultat observe:
- Resultat attendu:
- Severite: Bloquant / Majeur / Mineur
- Correctif applique:
- Retest: OK / KO

