# Consignes pour les assistants IA

Site du mariage de Valentine & Jean. Le détail de l'architecture, du déploiement Coolify et des variables d'environnement est dans le [README.md](README.md) : le lire avant toute modification du serveur, des dépendances, du `Dockerfile` ou de la base.

## Où tourne le code

En production, tout tourne dans **un seul conteneur Docker Linux x64** (`node:22-bookworm-slim`), construit par Coolify avec le [Dockerfile](Dockerfile) à chaque push sur `main`. Un unique processus Node/Express ([server.ts](server.ts)) sert le front React buildé **et** l'API `/api/*`. C'est le seul environnement d'exécution : pas de PHP, pas d'Apache, pas d'hébergement mutualisé.

- Toute logique côté serveur (formulaire, envoi de mail, traitement de données) s'écrit comme une route Express dans [server.ts](server.ts), appelée par le front en `/api/...`. Les emails partent par [server/mailer.ts](server/mailer.ts) (API Resend).
- Le contenu de `public/` est copié tel quel et servi en fichiers statiques : un script placé là n'est jamais exécuté, et n'importe qui peut télécharger son code source.
- Les données persistantes vont dans la base SQLite (`DB_PATH`, sur le volume `/data`). Tout autre fichier écrit par le serveur dans le conteneur disparaît au redéploiement suivant.

## Dépendances npm

On développe sous Windows ou macOS, mais le build se fait sous Linux.

- Un binaire natif propre à une plateforme (`@esbuild/win32-x64`, `@rollup/rollup-win32-x64-msvc`, `…-darwin-…`, `…-linux-…`) va dans `optionalDependencies`, en version exacte. En `dependencies`, npm refuse de l'installer sous Linux (`EBADPLATFORM`) et le déploiement échoue.
- Après une modification de `package.json`, `package-lock.json` ou du `Dockerfile`, vérifier que l'image se construit comme sur le serveur : `docker build --platform linux/amd64 .`. Si Docker n'est pas disponible, le signaler à l'utilisateur avant qu'il pousse.
