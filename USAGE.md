# Kuknos Analytics - Usage Guide

## Starting the Application

### Option 1: Use the Start Script (Recommended)

```bash
./start.sh
```

This single command will:
1. Fix npm permissions if needed
2. Start the backend server
3. Start the frontend development server
4. Display the PIDs and URLs

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

## Stopping the Application

If using `start.sh`:
- Press `Ctrl+C` once (it will clean up both processes)

If running separately:
- Press `Ctrl+C` in each terminal

## Navigation

The application has 6 pages accessible from the right-side sidebar:

1. **بازپرداخت‌ها (Refunds)** - `/refunds`
   - 7 KPI cards
   - 6 charts showing refund analytics

2. **خرید / پرداخت‌ها (Buys/Payments)** - `/buys`
   - 6 KPI cards
   - 6 charts showing purchase analytics

3. **تحلیل کاربران (User Analytics)** - `/users`
   - 2 KPI cards
   - 6 charts showing user behavior

4. **بخش A, B, C** - Placeholder pages for future features

## Common Issues & Solutions

### Issue: npm permission errors

**Solution:**
```bash
sudo chown -R $(whoami) frontend/
cd frontend && npm install
```

### Issue: Backend fails with database connection error

**Symptoms:** 503 error, "DB_UNREACHABLE" message

**Cause:** Database is unreachable (The app should work without VPN)

**Solutions:**
1. Check connection (The app should work without VPN)
2. Verify database credentials in `.env`
3. Test connection manually:
   ```bash
   cd backend
   uv run python -c "from app.database import engine; import asyncio; asyncio.run(engine.connect())"
   ```

### Issue: Frontend shows blank page

**Solutions:**
1. Check browser console for errors
2. Verify backend is running on port 8000
3. Clear browser cache and reload
4. Check that all dependencies are installed:
   ```bash
   cd frontend && npm install
   ```

### Issue: Charts not displaying

**Cause:** Missing ECharts dependency or API data fetch failure

**Solutions:**
1. Check browser console for errors
2. Verify API is returning data at http://localhost:8000/docs
3. Reinstall frontend dependencies:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: Persian text not showing correctly

**Solution:**
1. Ensure Vazirmatn font is loaded (check browser Network tab)
2. Clear browser cache
3. Verify HTML has `lang="fa" dir="rtl"` attributes

## Development Tips

### Adding a New API Endpoint

1. Add the SQL query to appropriate service file (e.g., `backend/app/services/buys_service.py`)
2. Add the route to appropriate router (e.g., `backend/app/routers/buys.py`)
3. Update frontend to consume the new endpoint

### Adding a New Chart

1. Fetch data in the page component (e.g., `frontend/src/pages/Buys.jsx`)
2. Use the `<ChartCard>` component with ECharts option
3. Ensure Persian formatting using utilities from `formatters.js`

### Customizing the Color Scheme

Edit `frontend/src/utils/chartDefaults.js` to change the `chartColors` array.

### Changing the Sidebar Order

Edit `frontend/src/components/Sidebar.jsx` and reorder items in the `menuItems` array.

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Get refunds KPIs
curl http://localhost:8000/api/refunds/kpis

# Get buy statistics
curl http://localhost:8000/api/buys/kpis
```

### Test Frontend Build

```bash
cd frontend
npm run build
npm run preview  # Serves the production build
```

## Logs

Backend logs are written to:
- Console (stderr)
- `backend/logs/kuknos.log` (with 10 MB rotation, 7 days retention)

View logs in real-time:
```bash
tail -f backend/logs/kuknos.log
```

## Environment Variables

Edit `.env` in the project root:

```env
# Database connection
DATABASE_URL=postgresql://username:password@host:port/walletserver

# Backend server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend dev server (used by Vite)
VITE_API_BASE_URL=http://localhost:8000/api
```

**Important:** Never commit `.env` to version control. Use `.env.example` as a template.

## Building for Production

### Backend

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

See `claude.md` section 14 for Docker deployment guidance.

## Getting Help

1. Check this guide for common issues
2. Review `README.md` for architecture overview
3. Consult `claude.md` for detailed implementation specs
4. Check backend logs at `backend/logs/kuknos.log`
5. Use browser DevTools console for frontend debugging
