# ONEBYONE Paris — Guide de déploiement Supabase + Vercel

## Structure du projet

```
onebyone-paris/
├── api/
│   ├── products.js          → GET /api/products
│   ├── orders.js            → POST /api/orders (commande + devis)
│   ├── auth.js              → POST /api/auth (inscription/connexion)
│   └── admin/
│       └── products.js      → CRUD produits admin
├── lib/
│   └── supabase.js          → Client Supabase partagé
├── public/
│   ├── index.html           → Page principale
│   ├── style.css            → Styles
│   └── app.js               → Logique frontend
├── supabase_schema.sql      → Schéma BDD à coller dans Supabase
├── vercel.json              → Config Vercel
└── package.json
```

---

## ÉTAPE 1 — Supabase (base de données + auth)

1. Va sur https://supabase.com → "New project"
2. Donne un nom : `onebyone-paris`
3. Choisis une région Europe (Frankfurt)
4. Crée le projet (attendre ~2 min)

### Configurer la base de données

1. Dans Supabase → **SQL Editor** → "New query"
2. Colle tout le contenu de `supabase_schema.sql`
3. Clique **Run** ✓

### Configurer l'Auth (emails)

1. Supabase → **Authentication** → **Settings**
2. **Site URL** : `https://ton-projet.vercel.app`
3. **Email Templates** → personnalise si tu veux

### Récupérer tes clés

Supabase → **Settings** → **API** :
- `Project URL` → c'est ton `SUPABASE_URL`
- `anon public` → c'est ton `SUPABASE_ANON_KEY`
- `service_role` → c'est ton `SUPABASE_SERVICE_KEY` (⚠️ gardez secret)

---

## ÉTAPE 2 — Configurer app.js

Ouvre `public/app.js` et remplace lignes 4-5 :

```js
const SUPABASE_URL = 'https://XXXXXXXXXX.supabase.co';  // ← colle ton URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';            // ← colle ta clé anon
```

---

## ÉTAPE 3 — Vercel (hébergement)

### Installer Vercel CLI
```bash
npm install -g vercel
```

### Déployer
```bash
cd onebyone-paris
vercel
```
Suis les instructions :
- Set up project? → **Y**
- Project name → `onebyone-paris`
- Directory? → **.**

### Ajouter les variables d'environnement

Après le premier déploiement :
```bash
vercel env add SUPABASE_URL
# colle ton URL Supabase

vercel env add SUPABASE_ANON_KEY
# colle ta clé anon

vercel env add SUPABASE_SERVICE_KEY
# colle ta clé service_role

vercel env add ADMIN_SECRET_KEY
# invente un mot de passe admin ex: MonMotDePasse2025!

vercel env add SITE_URL
# https://onebyone-paris.vercel.app
```

### Redéployer avec les variables
```bash
vercel --prod
```

---

## ÉTAPE 4 — Domaine custom (optionnel)

Si tu as un domaine `onebyone.paris` :
```bash
vercel domains add onebyone.paris
```
Puis configure les DNS chez ton registrar :
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

---

## RÉCAP DES FONCTIONNALITÉS

| Feature | Technologie |
|---------|-------------|
| Produits en BDD | Supabase PostgreSQL |
| Inscription/Connexion | Supabase Auth + email |
| Vérification email | Supabase (automatique) |
| Commandes | API Vercel + Supabase |
| Devis automatique | Généré côté serveur |
| Admin catalogue | API protégée (x-admin-key) |
| Hébergement | Vercel (CDN mondial) |
| SSL/HTTPS | Automatique (Vercel) |
| Paiement | Simulation (intégrer Stripe pour prod) |

---

## ALLER PLUS LOIN (production)

Pour un vrai paiement en ligne, intégre **Stripe** :
```bash
npm install stripe
```
Et remplace la fonction `processPayment()` par une vraie session Stripe Checkout.

---

## COMMANDES UTILES

```bash
vercel dev          # Tester en local
vercel --prod       # Déployer en production
vercel logs         # Voir les logs
vercel env ls       # Lister les variables d'env
```
