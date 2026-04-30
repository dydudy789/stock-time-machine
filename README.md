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





2026-04-27 — React & TypeScript Learnings

Union types restrict a variable to specific values e.g. useState<1|2|3|4>(1) — TypeScript shows an error if you try to set an invalid value
Interfaces are contracts for props — if a component expects userName: string and the parent doesn't pass it, TypeScript flags it immediately without running the app
useEffect runs code in response to state changes — [step] in the dependency array means "re-run when step changes"
useCallback caches a function across renders — when removed and replaced with a regular async function, the closing }, []) must also be removed or it causes a syntax error
Side effects — anything touching outside React (browser tab title via document.title, URL, API calls) belongs in useEffect, not directly in the component body


2026-04-30 — I learned FastAPI & Backend, implementing the endpoint to receive user feedback.
- Endpoints are URLs that the backend listens to. I built /api/feedback that can receive a message and optional email, adds a timestamp and saves it to feedback.json on the server.
- Pydantic models define and validate the shape of incoming data. If a required field is missing then it will reject it. 
- You can persist data without a db by using this I/O pattern: check if file exists -> read existing list -> append new entry -> dump appended list to json again using json.dump()
- A router is a mini app that focuses on one functionality. FastAPI and other frameworks use decorators for defining routers.
    The pattern is always:
            @router.post("/feedback")  <- #decorator
            def submit_feedback(body: FeedbackRequest):  <- #the function showing what to do if a request is received
    
    The decorator must always sit above the function.