from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import List, Dict, Any
import requests

router = APIRouter()

YAHOO_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def _to_unix(date_str: str) -> int:
    dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return int(dt.timestamp())


def _fetch_yahoo(symbol: str, start: str, end: str) -> List[Dict[str, Any]]:
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {
        "interval": "1mo",
        "period1": _to_unix(start),
        "period2": _to_unix(end),
        "includeAdjustedClose": "true",
        "events": "capitalGains",
    }

    resp = requests.get(url, params=params, headers=YAHOO_HEADERS, timeout=15)

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol}")
    if not resp.ok:
        raise HTTPException(status_code=502, detail=f"Yahoo Finance error {resp.status_code} for {symbol}")

    data = resp.json()

    try:
        result = data["chart"]["result"][0]
    except (KeyError, IndexError, TypeError):
        error = data.get("chart", {}).get("error", {})
        raise HTTPException(status_code=404, detail=f"No data for {symbol}: {error}")

    timestamps = result.get("timestamp", [])

    # Prefer adjusted close; fall back to regular close
    try:
        closes = result["indicators"]["adjclose"][0]["adjclose"]
    except (KeyError, IndexError):
        closes = result["indicators"]["quote"][0]["close"]

    prices = []
    for ts, price in zip(timestamps, closes):
        if price is None or price <= 0:
            continue
        date = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        prices.append({"date": date, "price": round(float(price), 4)})

    return prices


@router.get("/prices/{symbol}")
def get_prices(
    symbol: str,
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
):
    prices = _fetch_yahoo(symbol, start, end)
    if not prices:
        raise HTTPException(status_code=404, detail=f"No price data for {symbol}")
    return {"symbol": symbol, "prices": prices}


@router.get("/prices-bulk")
def get_prices_bulk(
    symbols: str = Query(..., description="Comma-separated symbols"),
    start: str = Query(...),
    end: str = Query(...),
):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results: Dict[str, List[Dict[str, Any]]] = {}

    for symbol in symbol_list:
        try:
            results[symbol] = _fetch_yahoo(symbol, start, end)
        except HTTPException:
            results[symbol] = []
        except Exception:
            results[symbol] = []

    return results
