FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
RUN npm ci

COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/
COPY server/ ./server/

RUN npm run build

# ─── Production ──────────────────────────────────────────────
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
RUN npm ci --omit=dev

COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/server/dist/ ./server/dist/

ENV NODE_ENV=production
ENV USE_FIRESTORE=true
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/dist/server/index.js"]
