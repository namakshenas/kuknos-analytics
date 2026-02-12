from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.services import buys_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_buys_kpis(session: AsyncSession = Depends(get_session)):
    """Get all buy-related KPI cards"""
    return await buys_service.get_kpis(session)


@router.get("/daily-count", response_model=SeriesResponse)
async def get_daily_purchase_count(session: AsyncSession = Depends(get_session)):
    """Get daily purchase count (last 12 months)"""
    return await buys_service.get_daily_count(session)


@router.get("/daily-volume", response_model=SeriesResponse)
async def get_daily_purchase_volume(session: AsyncSession = Depends(get_session)):
    """Get daily purchase volume in Rials (last 12 months)"""
    return await buys_service.get_daily_volume(session)


@router.get("/monthly-trend", response_model=SeriesResponse)
async def get_monthly_purchase_trend(session: AsyncSession = Depends(get_session)):
    """Get monthly purchase trend"""
    return await buys_service.get_monthly_trend(session)


@router.get("/exchange-rate-trend", response_model=SeriesResponse)
async def get_exchange_rate_trend(session: AsyncSession = Depends(get_session)):
    """Get daily average exchange rate trend"""
    return await buys_service.get_exchange_rate_trend(session)


@router.get("/by-gateway", response_model=DistributionResponse)
async def get_purchases_by_gateway(session: AsyncSession = Depends(get_session)):
    """Get purchases breakdown by payment gateway"""
    return await buys_service.get_by_gateway(session)


@router.get("/by-application", response_model=DistributionResponse)
async def get_purchases_by_application(session: AsyncSession = Depends(get_session)):
    """Get purchases breakdown by application source"""
    return await buys_service.get_by_application(session)


@router.get("/status-distribution", response_model=DistributionResponse)
async def get_status_distribution(session: AsyncSession = Depends(get_session)):
    """Get transaction status distribution"""
    return await buys_service.get_status_distribution(session)


@router.get("/amount-distribution", response_model=DistributionResponse)
async def get_amount_distribution(session: AsyncSession = Depends(get_session)):
    """Get purchase amount distribution (bucket histogram)"""
    return await buys_service.get_amount_distribution(session)
