# Kuknos Analytics

Persian/RTL analytics dashboard for PMN token transactions. A read-only analytics platform that connects to an existing PostgreSQL database, executes analytical queries, and displays results through KPI cards and interactive charts.

## Features

- **Persian Language & RTL Support**: Full Persian interface with Vazirmatn font and right-to-left layout
- **Real-time Analytics**: 23 API endpoints serving 35 pre-defined SQL queries
- **Interactive Dashboards**:
  - Buy/Payment Analytics (9 endpoints)
  - Refund Analytics (7 endpoints)
  - User Analytics (7 endpoints)
- **Rich Visualizations**: KPI cards, line charts, pie charts, bar charts using Apache ECharts
- **VPN-aware Error Handling**: The app should work without VPN

## Tech Stack

### Backend
- **Python 3.11+** with FastAPI
- **async SQLAlchemy** + asyncpg for PostgreSQL
- **Loguru** for structured logging
- **uv** for package management

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Apache ECharts** for charts
- **React Router** for navigation
- **Axios** for API calls
- **jalaali-js** for Persian calendar support

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database access (The app should work without VPN)
- uv installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Installation

1. Clone the repository and navigate to the project directory

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Run the application:
   ```bash
   ./start.sh
   ```

This will:
- Fix npm permissions (if needed)
- Start the backend on `http://localhost:8000`
- Start the frontend on `http://localhost:5173`

### Accessing the Application

- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Project Structure

```
kuknos-analytics/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── database.py       # DB connection
│   │   ├── logger.py         # Logging setup
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── schemas/          # Pydantic models
│   └── pyproject.toml
│
├── frontend/
│   └── src/
│       ├── api/              # API client
│       ├── components/       # Reusable components
│       ├── pages/            # Page components
│       ├── utils/            # Utilities (formatters, chart defaults)
│       ├── App.jsx           # Router
│       └── main.jsx          # Entry point
│
├── .env                      # Environment variables
├── start.sh                  # Startup script
└── claude.md                 # Architecture documentation
```

## Database Requirements

The application expects an existing PostgreSQL database with:
- `pending_txes` table (token purchases)
- `pending_refunds` table (token sells/refunds)

See `claude.md` for complete schema documentation.

## Development

### Backend Only
```bash
cd backend
uv run uvicorn app.main:app --reload
```

### Frontend Only
```bash
cd frontend
npm run dev
```

### Adding Dependencies

**Backend:**
```bash
cd backend
uv add <package-name>
```

**Frontend:**
```bash
cd frontend
npm install <package-name>
```

## API Endpoints

### Buys / Payments (`/api/buys/*`)
- `/kpis` - 6 KPI metrics
- `/daily-count` - Daily purchase count (12 months)
- `/daily-volume` - Daily purchase volume in Rials
- `/monthly-trend` - Monthly aggregated data
- `/exchange-rate-trend` - Daily average exchange rate
- `/by-gateway` - Distribution by payment gateway
- `/by-application` - Distribution by app source
- `/status-distribution` - Transaction status breakdown
- `/amount-distribution` - Purchase amount histogram

### Refunds (`/api/refunds/*`)
- `/kpis` - 7 KPI metrics
- `/daily-count` - Daily refund count
- `/monthly-trend` - Monthly refund trend
- `/rate-trend` - Daily average refund rate
- `/status-distribution` - Refund status breakdown
- `/by-bank` - Distribution by destination bank
- `/amount-distribution` - Refund amount histogram

### Users (`/api/users/*`)
- `/kpis` - 2 KPI metrics
- `/new-per-month` - New users per month
- `/top-buyers` - Top 10 buyers by volume
- `/top-sellers` - Top 10 sellers by volume
- `/activity-distribution` - User activity histogram
- `/monthly-active` - Monthly active users
- `/buy-sell-comparison` - Buy vs Sell monthly comparison

## Error Handling

The application handles connectivity issues gracefully:
- The app should work without VPN
- Backend returns 503 with `DB_UNREACHABLE` code
- Frontend displays Persian error message with retry button
- All database operations are wrapped in try/except blocks

## Architecture

For complete architectural documentation, implementation details, and SQL queries, see [`claude.md [not_included]`](claude.md).

## License

MIT

## Support

For issues or questions, please check the architecture documentation in `claude.md`.
