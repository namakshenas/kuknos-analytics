# Kuknos Analytics - Quick Start

## Prerequisites ✓
- [x] Python 3.11+
- [x] Node.js 18+
- [x] uv installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Installation (First Time Only)

```bash
# 1. Navigate to project
cd /Users/mmm/Documents/kuknos-analytics

# 2. Configure environment (if not done)
cp .env.example .env
# Edit .env with your database credentials

# 3. Install backend dependencies (already done)
cd backend && uv sync && cd ..

# 4. Install frontend dependencies (already done)
cd frontend && npm install && cd ..
```

## Start the Application

```bash
# Single command to start both servers
./start.sh
```

**That's it!**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Stop the Application

Press `Ctrl+C` once (cleans up both processes automatically)

## Navigation

Click the sidebar items (on the right side):

1. **بازپرداخت‌ها** - Refunds analytics
2. **خرید / پرداخت‌ها** - Buys/payments analytics
3. **تحلیل کاربران** - User analytics
4. **بخش A, B, C** - Placeholder pages

## Troubleshooting

### Error: Database connection failed

**Solution:** Check your connection

### Error: npm permission issues

```bash
sudo chown -R $(whoami) frontend/
cd frontend && npm install
```

### Error: Port 8000 already in use

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Error: Port 5173 already in use

```bash
# Find and kill the process
lsof -ti:5173 | xargs kill -9
```

## Common Commands

```bash
# Backend only
cd backend
uv run uvicorn app.main:app --reload

# Frontend only
cd frontend
npm run dev

# Build frontend for production
cd frontend
npm run build

# View backend logs
tail -f backend/logs/kuknos.log

# Test API endpoint
curl http://localhost:8000/api/refunds/kpis
```

## File Structure at a Glance

```
kuknos-analytics/
├── start.sh          ← Start everything
├── .env              ← Database config
├── backend/          ← Python/FastAPI
│   └── app/
│       ├── main.py
│       ├── routers/  ← API endpoints
│       └── services/ ← SQL queries
└── frontend/         ← React/Vite
    └── src/
        ├── pages/    ← Main pages
        └── components/ ← Reusable UI
```

## Need More Help?

- **Quick reference:** This file
- **Usage guide:** `USAGE.md`
- **Architecture:** `README.md`
- **Complete spec:** `claude.md [not included]`

---

**Ready?** Run `./start.sh` and open http://localhost:5173
