# Mariage Valentine & Jean — 17 avril 2027

Site de mariage avec formulaire RSVP, liste de cadeaux et espace admin pour les mariés.

> ⚠️ **Ne pas resynchroniser ce dépôt depuis Google AI Studio** : cela écrase les correctifs de sécurité et de déploiement appliqués sur `main` (c'est déjà arrivé). Travailler directement sur ce dépôt Git.

---

## 1. Architecture technique

```
Navigateur invité
      │  HTTP(S)
      ▼
Proxy Coolify (Traefik) ── domaine → conteneur
      │
      ▼
Conteneur Docker (port 3000)
└── node dist/server.cjs        ← serveur Express unique
    ├── sert le front React buildé (dist/)
    ├── API REST /api/*         ← RSVP, familles, stats, admin
    └── SQLite via sql.js       ← fichier /data/wedding.db
                                   └── volume Docker persistant "wedding-data"
```

- **Front** : React 19 + Vite 6 + Tailwind 4 ([src/](src/)). Buildé en fichiers statiques dans `dist/`.
- **Back** : Express ([server.ts](server.ts)), bundlé en un seul fichier `dist/server.cjs` par esbuild. Un seul processus sert le front **et** l'API.
- **Base de données** : SQLite chargée en mémoire par [sql.js](https://github.com/sql-js/sql.js) ([server/db.ts](server/db.ts)). Chaque écriture ré-enregistre le fichier complet sur disque (`saveDatabaseToDisk`). Adapté à l'échelle d'un mariage ; **une seule instance de l'app doit tourner** (ne jamais scaler à plusieurs replicas).
- **Emails** : [server/mailer.ts](server/mailer.ts) envoie une notification à chaque RSVP via l'API Resend **si** `RESEND_API_KEY` est configurée. Sinon, les réponses restent simplement consultables dans le dashboard.

## 2. Comment le site est déployé

### Chaîne de déploiement

1. `git push` sur la branche **`main`** de `github.com/jeanbenard76/Val-Jean`.
2. Dans **Coolify** (auto-hébergé sur le serveur OVH `217.182.65.44`), l'application pointe vers ce dépôt, branche `main`.
3. Coolify clone le commit, construit l'image avec le **[Dockerfile](Dockerfile)** du dépôt (Build Pack = `Dockerfile` — PAS Nixpacks, voir §5), puis fait un *rolling update* : nouveau conteneur démarré, ancien supprimé.
4. Le proxy de Coolify route le domaine vers le port **3000** du conteneur et gère le certificat HTTPS (Let's Encrypt) automatiquement.

Le déploiement se déclenche par le bouton **Deploy/Redeploy** dans Coolify (ou automatiquement à chaque push si le webhook GitHub est activé dans l'onglet *Webhooks*).

### Le Dockerfile (2 étapes)

```
Étape "build"  : node:22-bookworm-slim → npm ci → npm run build
                 (vite build → dist/ ; esbuild server.ts → dist/server.cjs)
Étape finale   : node:22-bookworm-slim → npm ci --omit=dev
                 + copie de dist/ et src/data/ → CMD node dist/server.cjs
```

L'image finale ne contient que les dépendances de production. `src/data/registry_gifts.json` est copié car la route `/api/registry` le lit/écrit à l'exécution.

### Configuration Coolify de l'application

| Réglage | Valeur |
|---|---|
| Build Pack | **Dockerfile** |
| Ports Exposes | `3000` |
| Persistent Storage | volume `wedding-data` monté sur **`/data`** |
| Healthcheck (conseillé) | `GET /api/health`, port 3000 |

### Variables d'environnement (Coolify → Environment Variables)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NODE_ENV=production` | oui | mode production du serveur |
| `ADMIN_TOKEN` | oui | mot de passe de l'Espace Mariés et des routes admin. Sans elle, les routes admin renvoient 503 (bloquées par défaut). |
| `DB_PATH=/data/wedding.db` | oui | emplacement du fichier SQLite **sur le volume persistant** |
| `RESEND_API_KEY` | non | notifications email des réponses RSVP |

## 3. Persistance des données (important)

Le fichier `wedding.db` vit sur le **volume Docker `wedding-data`** monté dans `/data`. Un redéploiement remplace le conteneur mais **réattache le même volume** : les réponses des invités survivent aux mises à jour du site.

La base est réinitialisée (5 familles d'exemple re-semées) **uniquement** si :
- le volume est supprimé dans Coolify,
- `DB_PATH` est retirée/modifiée (la base repartirait dans le conteneur, éphémère),
- quelqu'un clique « Effacer les réponses » dans le dashboard (protégé par mot de passe).

**Sauvegardes** : bouton « Télécharger wedding.db » dans le dashboard admin → à faire régulièrement pendant la période de réponses. Le fichier n'est **jamais** versionné dans git (données personnelles, voir `.gitignore`).

## 4. Sécurité

- Routes protégées par `ADMIN_TOKEN` (header `x-admin-token` ou `?key=` pour les liens de téléchargement) : `/api/admin/*`, `GET /api/rsvps`, `POST /api/registry`.
- **Espace Mariés** : lien « Admin » dans le pied de page → le navigateur demande le mot de passe (prompt natif) **à chaque visite**, vérifié côté serveur via `GET /api/admin/verify`. Jamais stocké côté navigateur.
- Routes publiques (nécessaires au formulaire invité) : `GET /api/families` (recherche du nom), `GET /api/stats`, `POST /api/rsvp` (limité à 10 envois / 10 min / IP), `GET /api/registry`, `GET /api/health`.
- Le HTML des emails échappe les saisies des invités ; les requêtes SQL sont paramétrées.

## 5. Pièges connus (lire avant de toucher au déploiement)

- **Ne jamais activer « Is it a static site? »** dans Coolify : le site serait servi par Caddy en statique, l'API ne tournerait plus, et les RSVP partiraient silencieusement dans le localStorage des invités au lieu de la base (le front a un fallback localStorage qui masque la panne). Symptôme : `/api/health` renvoie du HTML au lieu de JSON.
- **Test de bonne santé après chaque changement d'infra** : `https://<domaine>/api/health` doit renvoyer `{"status":"ok","db":"wedding.db active"}`.
- Les binaires natifs Linux (Rollup, Tailwind, LightningCSS, esbuild) sont épinglés en `optionalDependencies` dans [package.json](package.json) pour contourner un bug npm ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) qui cassait `npm ci` dans Docker. Ne pas les supprimer.
- Gestionnaire de paquets : **npm** (`package-lock.json`). Ne pas réintroduire `yarn.lock`/`bun.lock`.
- Une seule instance : sql.js réécrit tout le fichier à chaque écriture — deux replicas se corrompraient mutuellement.
- Les images référencées par des **chemins en dur** (registry_gifts.json, etc.) doivent être dans `public/images/` et référencées par `/images/...`. Les chemins `/src/assets/...` ne fonctionnent qu'en dev.

## 6. Développement local

```bash
npm install
npm run dev        # serveur Express + Vite middleware sur http://localhost:3000
```

En dev, sans `ADMIN_TOKEN` défini, l'Espace Mariés est accessible sans mot de passe et la base est le fichier `wedding.db` à la racine du projet (ignoré par git).

Build de production en local :

```bash
npm run build && NODE_ENV=production npm start
# ou, pour reproduire exactement la prod :
docker build -t wedding . && docker run -p 3000:3000 -e ADMIN_TOKEN=test -e DB_PATH=/data/wedding.db -v wedding-data:/data wedding
```

`npm run lint` lance la vérification TypeScript (`tsc --noEmit`).

## 7. Référence rapide de l'API

| Méthode & route | Accès | Description |
|---|---|---|
| `GET /api/health` | public | statut du serveur |
| `GET /api/families[?q=nom]` | public | familles + membres (recherche invité) |
| `GET /api/stats` | public | statistiques agrégées |
| `POST /api/rsvp` | public (rate-limité) | soumission d'une réponse |
| `GET /api/registry` | public | liste de cadeaux (JSON) |
| `GET /api/admin/verify` | token | validation du mot de passe admin |
| `GET /api/rsvps` | token | journal des réponses |
| `POST /api/admin/update-invitation` | token | portées d'invitation d'une famille |
| `POST /api/admin/clear-rsvps` | token | ⚠️ efface tout et re-seed |
| `GET /api/admin/export-csv` | token | export CSV traiteur |
| `GET /api/admin/download-db` | token | téléchargement de wedding.db |
| `POST /api/registry` | token | mise à jour de la liste de cadeaux |
