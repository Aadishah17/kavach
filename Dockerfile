FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ ./packages/
COPY server/ ./server/
RUN npm ci
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
RUN npm ci --omit=dev

COPY --from=build /app/server/dist/ ./server/dist/
COPY public/ ./public/

ENV NODE_ENV=production
ENV USE_FIRESTORE=true
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/dist/server/index.js"]
