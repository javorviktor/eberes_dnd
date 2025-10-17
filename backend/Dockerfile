FROM node:20-bullseye-slim AS base
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm install --prod=false && pnpm prisma:generate && pnpm build

EXPOSE 4000
CMD ["node", "dist/index.js"]

