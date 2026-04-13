# Stock Time Machine

DCA simulator using real historical stock prices from Yahoo Finance.

## Setup

### Backend (FastAPI + yfinance)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Architecture

- **Backend**: FastAPI proxies Yahoo Finance via `yfinance` (no CORS issues, reliable data)
- **Frontend**: React + Vite + Recharts + Tailwind CSS
- **DCA Logic**: Runs entirely in the browser after fetching prices from the backend

## How it works

1. Pick an era (1990–1995, 1995–2000, 2000–2005)
2. Select stocks you want to simulate
3. Set monthly investment amount and date range
4. The backend fetches monthly adjusted-close prices from Yahoo Finance
5. The frontend calculates DCA results and renders interactive charts
