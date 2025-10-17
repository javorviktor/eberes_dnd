# D&D Character Builder (MVP)

Minimal multi-container web app using Next.js (TS) + Express (TS) + Prisma + PostgreSQL.

## Tech
- Frontend: Next.js + React + TypeScript + TailwindCSS
- Backend: Express + TypeScript + Prisma ORM
- Database: PostgreSQL 15
- Auth: JWT + bcrypt
- Containerization: Docker + Docker Compose

## Project Layout
```
root/
├─ backend/ (Express + Prisma)
├─ frontend/ (Next.js + Tailwind)
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## Prerequisites
- Node.js 18+
- pnpm
- Docker Desktop (with Compose)

## Setup
1. Install deps:
   ```bash
   pnpm install -r
   ```
2. Environment variables (create a `.env` at repo root if needed):
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@db:5432/dnd?schema=public
   JWT_SECRET=change_me_in_prod
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```
3. Start services:
   ```bash
   docker compose up --build
   ```
4. Prisma migrate runs automatically at backend start. To run manually:
   ```bash
   docker compose exec backend pnpm prisma migrate deploy
   ```

- Backend: http://localhost:4000
- Frontend: http://localhost:3000

## Development
- Dev scripts (from host):
  - `pnpm -C backend dev`
  - `pnpm -C frontend dev`

## Core Features (MVP)
- User signup/login (JWT)
- CRUD for Characters (name, race, class, level, STR, DEX, CON, INT, WIS, CHA)
- CRUD for Inventory items linked to characters
- Character Sheet page showing stats & inventory

## Notes
- If `.env.example` creation is blocked in your environment, copy the variables above into a new `.env` in the project root.

## License
MIT
