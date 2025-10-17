# Quick Start – D&D Character Builder (MVP)

## 0) Prereqs
- Docker Desktop: running (Linux engine)
- Node.js 18+ and npm

## 1) Enable pnpm (once)
```powershell
npm i -g corepack; corepack enable; corepack prepare pnpm@9.0.0 --activate
```

## 2) Install deps
```powershell
cd C:\Users\beats\Desktop\dnd_app
pnpm install -r
```

## 3) Environment
If needed, create `.env` in repo root with:
```bash
DATABASE_URL=postgresql://postgres:postgres@db:5432/dnd?schema=public
JWT_SECRET=change_me_in_prod
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 4) Start the stack
```powershell
docker compose up -d --build
```
- Backend: http://localhost:4000 (health: /health)
- Frontend: http://localhost:3000

Migrations run automatically on backend start. To run manually:
```powershell
docker compose exec backend pnpm prisma migrate deploy
```

## 5) Useful commands
- View logs (follow):
```powershell
docker compose logs -f backend
```
- Restart a service:
```powershell
docker compose restart backend
```
- Stop everything:
```powershell
docker compose down
```
