# Mariage Valentine & Jean — 17 avril 2027

Site de mariage : React 19 + Vite 6 + Tailwind 4, serveur Express (API RSVP + fichiers statiques), base SQLite (fichier `wedding.db`).

> ⚠️ **Ne pas resynchroniser ce dépôt depuis Google AI Studio** : cela écrase les correctifs de sécurité (auth admin, injection SQL, import Vite) appliqués sur `main`. Travailler directement sur ce dépôt Git.

## Développement local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build & production

```bash
npm run build      # front (dist/) + serveur (dist/server.cjs)
npm start          # NODE_ENV=production requis
```

## Variables d'environnement

Voir [.env.example](.env.example) :

| Variable | Rôle |
|---|---|
| `NODE_ENV` | `production` en déploiement |
| `ADMIN_TOKEN` | **Obligatoire en prod** — protège `/api/admin/*`, `/api/rsvps` et `POST /api/registry` |
| `DB_PATH` | Chemin du fichier SQLite (ex. `/data/wedding.db` sur un volume persistant) |
| `RESEND_API_KEY` | Optionnel — notifications email des réponses RSVP via Resend |

## Espace mariés (dashboard admin)

Accessible via `https://votre-domaine.fr/?admin=<ADMIN_TOKEN>` (le token est mémorisé pour la session). Sans token valide, les routes admin renvoient 401.

## Déploiement Coolify

1. Application → dépôt GitHub, branche `main`, buildpack Nixpacks, **« Is it a static site? » décoché**.
2. Build : `npm run build` — Start : `npm start` — Port : `3000`.
3. Variables : `NODE_ENV=production`, `ADMIN_TOKEN=<token fort>`, `DB_PATH=/data/wedding.db`, `RESEND_API_KEY` (optionnel).
4. Persistent Storage : volume monté sur `/data` (indispensable, sinon les réponses RSVP sont perdues à chaque redéploiement).
5. Health check : `GET /api/health` — doit renvoyer du JSON, pas du HTML.
