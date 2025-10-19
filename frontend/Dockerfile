FROM node:20-alpine AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json ./
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY app ./app
COPY lib ./lib
COPY public ./public

RUN pnpm install && pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]

