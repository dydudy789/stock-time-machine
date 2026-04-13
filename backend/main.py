import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import prices

app = FastAPI(title="Stock Time Machine API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prices.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
