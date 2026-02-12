from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.services import users_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse, TopUsersResponse, BuySellComparisonResponse

router = APIRouter()


@router.get("/kpis", response_model=KPIResponse)
async def get_users_kpis(session: AsyncSession = Depends(get_session)):
    """Get user analytics KPI cards"""
    return await users_service.get_kpis(session)


@router.get("/new-per-month", response_model=SeriesResponse)
async def get_new_users_per_month(session: AsyncSession = Depends(get_session)):
    """Get new users per month (by first purchase date)"""
    return await users_service.get_new_per_month(session)


@router.get("/top-buyers", response_model=TopUsersResponse)
async def get_top_buyers(session: AsyncSession = Depends(get_session)):
    """Get top 10 buyers by volume"""
    return await users_service.get_top_buyers(session)


@router.get("/top-sellers", response_model=TopUsersResponse)
async def get_top_sellers(session: AsyncSession = Depends(get_session)):
    """Get top 10 sellers by volume"""
    return await users_service.get_top_sellers(session)


@router.get("/activity-distribution", response_model=DistributionResponse)
async def get_activity_distribution(session: AsyncSession = Depends(get_session)):
    """Get user activity distribution (transaction count histogram)"""
    return await users_service.get_activity_distribution(session)


@router.get("/monthly-active", response_model=SeriesResponse)
async def get_monthly_active_users(session: AsyncSession = Depends(get_session)):
    """Get monthly active users"""
    return await users_service.get_monthly_active(session)


@router.get("/buy-sell-comparison", response_model=BuySellComparisonResponse)
async def get_buy_sell_comparison(session: AsyncSession = Depends(get_session)):
    """Get buy vs sell volume comparison per month"""
    return await users_service.get_buy_sell_comparison(session)
