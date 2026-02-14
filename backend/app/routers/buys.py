from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_session
from app.services import buys_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_buys_kpis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_kpis(session, start_date, end_date)


@router.get("/daily-count", response_model=SeriesResponse)
async def get_daily_purchase_count(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_daily_count(session, start_date, end_date)


@router.get("/daily-volume", response_model=SeriesResponse)
async def get_daily_purchase_volume(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_daily_volume(session, start_date, end_date)


@router.get("/monthly-trend", response_model=SeriesResponse)
async def get_monthly_purchase_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_monthly_trend(session, start_date, end_date)


@router.get("/exchange-rate-trend", response_model=SeriesResponse)
async def get_exchange_rate_trend(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_exchange_rate_trend(session, start_date, end_date)


@router.get("/by-gateway", response_model=DistributionResponse)
async def get_purchases_by_gateway(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_by_gateway(session, start_date, end_date)


@router.get("/by-application", response_model=DistributionResponse)
async def get_purchases_by_application(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_by_application(session, start_date, end_date)


@router.get("/status-distribution", response_model=DistributionResponse)
async def get_status_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_status_distribution(session, start_date, end_date)


@router.get("/amount-distribution", response_model=DistributionResponse)
async def get_amount_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await buys_service.get_amount_distribution(session, start_date, end_date)
