from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_session
from app.services import users_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse, TopUsersResponse, BuySellComparisonResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_users_kpis(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_kpis(session, start_date, end_date)


@router.get("/new-per-month", response_model=SeriesResponse)
async def get_new_users_per_month(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_new_per_month(session, start_date, end_date)


@router.get("/top-buyers", response_model=TopUsersResponse)
async def get_top_buyers(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_top_buyers(session, start_date, end_date)


@router.get("/top-sellers", response_model=TopUsersResponse)
async def get_top_sellers(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_top_sellers(session, start_date, end_date)


@router.get("/activity-distribution", response_model=DistributionResponse)
async def get_activity_distribution(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_activity_distribution(session, start_date, end_date)


@router.get("/monthly-active", response_model=SeriesResponse)
async def get_monthly_active_users(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_monthly_active(session, start_date, end_date)


@router.get("/buy-sell-comparison", response_model=BuySellComparisonResponse)
async def get_buy_sell_comparison(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await users_service.get_buy_sell_comparison(session, start_date, end_date)
