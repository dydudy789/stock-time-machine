from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import List, Dict, Any
import requests
import csv
import io

router = APIRouter()

YAHOO_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}

STOOQ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

# Stooq uses different symbol formats for some tickers
STOOQ_SYMBOL_MAP = {
    "BRK-B": "brk.b.us",
    "BTC-USD": "btc.v",
}


def _to_unix(date_str: str) -> int:
    dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return int(dt.timestamp())


def _stooq_symbol(symbol: str) -> str:
    if symbol in STOOQ_SYMBOL_MAP:
        return STOOQ_SYMBOL_MAP[symbol]
    return f"{symbol.lower()}.us"


def _fetch_stooq(symbol: str, start: str, end: str) -> List[Dict[str, Any]]:
    stooq_sym = _stooq_symbol(symbol)
    d1 = start.replace("-", "")
    d2 = end.replace("-", "")
    url = f"https://stooq.com/q/d/l/?s={stooq_sym}&d1={d1}&d2={d2}&i=m"

    resp = requests.get(url, headers=STOOQ_HEADERS, timeout=15)
    if not resp.ok:
        return []

    content = resp.text.strip()
    if not content or "No data" in content or len(content) < 20:
        return []

    prices = []
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        try:
            date = row.get("Date", "").strip()
            close = float(row.get("Close", 0))
            if date and close > 0:
                prices.append({"date": date, "price": round(close, 4)})
        except (ValueError, KeyError):
            continue

    # Stooq returns newest first — reverse to chronological
    prices.reverse()
    return prices


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


def _fetch_with_fallback(symbol: str, start: str, end: str) -> List[Dict[str, Any]]:
    """Try Yahoo Finance first. If data starts significantly later than requested,
    fall back to Stooq which has better pre-1985 coverage."""
    try:
        yahoo_prices = _fetch_yahoo(symbol, start, end)
    except HTTPException:
        yahoo_prices = []
    except Exception:
        yahoo_prices = []

    # Check if Yahoo returned data close to the requested start date (within 2 years)
    start_dt = datetime.strptime(start, "%Y-%m-%d")
    if yahoo_prices:
        first_dt = datetime.strptime(yahoo_prices[0]["date"], "%Y-%m-%d")
        gap_years = (first_dt - start_dt).days / 365
        if gap_years <= 2:
            return yahoo_prices  # Yahoo data is good enough

    # Yahoo data is missing or starts too late — try Stooq
    stooq_prices = _fetch_stooq(symbol, start, end)
    if stooq_prices:
        stooq_first = datetime.strptime(stooq_prices[0]["date"], "%Y-%m-%d")
        # Use Stooq if it starts earlier than Yahoo
        if not yahoo_prices or stooq_first < datetime.strptime(yahoo_prices[0]["date"], "%Y-%m-%d"):
            return stooq_prices

    return yahoo_prices


@router.get("/prices/{symbol}")
def get_prices(
    symbol: str,
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
):
    prices = _fetch_with_fallback(symbol, start, end)
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
            results[symbol] = _fetch_with_fallback(symbol, start, end)
        except Exception:
            results[symbol] = []

    return results
