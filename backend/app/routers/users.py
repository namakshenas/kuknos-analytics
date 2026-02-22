from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_session
from app.services import users_service
from app.schemas.analytics import KPIResponse, SeriesResponse, DistributionResponse, TopUsersResponse, BuySellComparisonResponse, PendingUsersResponse

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


@router.get("/pending-users", response_model=PendingUsersResponse)
async def get_pending_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    public: Optional[str] = Query(None),
    national_id: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    iban: Optional[str] = Query(None),
    cardnumber: Optional[str] = Query(None),
    mobile: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    filters = {}
    for key, val in [
        ("public", public),
        ("national_id", national_id),
        ("first_name", first_name),
        ("last_name", last_name),
        ("iban", iban),
        ("cardnumber", cardnumber),
        ("mobile", mobile),
    ]:
        if val:
            filters[key] = val
    return await users_service.get_pending_users(session, page, page_size, filters or None)


@router.get("/pending-users/export")
async def export_pending_users(
    public: Optional[str] = Query(None),
    national_id: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    iban: Optional[str] = Query(None),
    cardnumber: Optional[str] = Query(None),
    mobile: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    filters = {}
    for key, val in [
        ("public", public),
        ("national_id", national_id),
        ("first_name", first_name),
        ("last_name", last_name),
        ("iban", iban),
        ("cardnumber", cardnumber),
        ("mobile", mobile),
    ]:
        if val:
            filters[key] = val
    data = await users_service.get_pending_users_export(session, filters or None)
    return {"data": data}
