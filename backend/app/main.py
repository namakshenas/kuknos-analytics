from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine
from app.logger import setup_logger
from app.routers import buys, refunds, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown events"""
    # Startup
    setup_logger()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Kuknos Analytics API",
    description="Persian/RTL analytics dashboard for PMN token transactions",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(buys.router, prefix="/api/buys", tags=["buys"])
app.include_router(refunds.router, prefix="/api/refunds", tags=["refunds"])
app.include_router(users.router, prefix="/api/users", tags=["users"])


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Kuknos Analytics API",
        "docs": "/docs",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
