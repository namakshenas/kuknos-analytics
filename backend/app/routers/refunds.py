from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_session
from app.services import refunds_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse, CandlestickResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_refunds_kpis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_kpis(session, start_date, end_date)


@router.get("/daily-count", response_model=SeriesResponse)
async def get_daily_refund_count(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_daily_count(session, start_date, end_date)


@router.get("/monthly-trend", response_model=SeriesResponse)
async def get_monthly_refund_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_monthly_trend(session, start_date, end_date)


@router.get("/rate-trend", response_model=SeriesResponse)
async def get_refund_rate_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_rate_trend(session, start_date, end_date)


@router.get("/rate-candlestick", response_model=CandlestickResponse)
async def get_rate_candlestick(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_rate_candlestick(session, start_date, end_date)


@router.get("/status-distribution", response_model=DistributionResponse)
async def get_status_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_status_distribution(session, start_date, end_date)


@router.get("/by-bank", response_model=DistributionResponse)
async def get_refunds_by_bank(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_by_bank(session, start_date, end_date)


@router.get("/amount-distribution", response_model=DistributionResponse)
async def get_amount_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await refunds_service.get_amount_distribution(session, start_date, end_date)
