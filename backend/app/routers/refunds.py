from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.services import refunds_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_refunds_kpis(session: AsyncSession = Depends(get_session)):
    """Get all refund-related KPI cards"""
    return await refunds_service.get_kpis(session)


@router.get("/daily-count", response_model=SeriesResponse)
async def get_daily_refund_count(session: AsyncSession = Depends(get_session)):
    """Get daily refund count (last 12 months)"""
    return await refunds_service.get_daily_count(session)


@router.get("/monthly-trend", response_model=SeriesResponse)
async def get_monthly_refund_trend(session: AsyncSession = Depends(get_session)):
    """Get monthly refund trend"""
    return await refunds_service.get_monthly_trend(session)


@router.get("/rate-trend", response_model=SeriesResponse)
async def get_refund_rate_trend(session: AsyncSession = Depends(get_session)):
    """Get daily average refund rate trend"""
    return await refunds_service.get_rate_trend(session)


@router.get("/status-distribution", response_model=DistributionResponse)
async def get_status_distribution(session: AsyncSession = Depends(get_session)):
    """Get refund status distribution"""
    return await refunds_service.get_status_distribution(session)


@router.get("/by-bank", response_model=DistributionResponse)
async def get_refunds_by_bank(session: AsyncSession = Depends(get_session)):
    """Get refunds breakdown by destination bank"""
    return await refunds_service.get_by_bank(session)


@router.get("/amount-distribution", response_model=DistributionResponse)
async def get_amount_distribution(session: AsyncSession = Depends(get_session)):
    """Get refund amount distribution (bucket histogram)"""
    return await refunds_service.get_amount_distribution(session)
