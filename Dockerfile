# --- Étape 1 : build du front (Vite) et du serveur (esbuild) ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape 2 : image finale, dépendances de production uniquement ---
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# registry_gifts.json est lu/écrit à l'exécution par /api/registry
COPY --from=build /app/src/data ./src/data

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
