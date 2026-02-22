from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, List, Optional
from app.services.date_utils import build_date_filter


async def get_kpis(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT COUNT(DISTINCT wallet) AS total_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = 'PMN' AND status = '0'{df}
                    UNION
                    SELECT public AS wallet FROM pending_refunds WHERE code = 'PMN' AND status = '0'{df}
                ) AS all_users
            """),
            params,
        )
        total_users = result.scalar() or 0

        result = await session.execute(
            text(f"""
                SELECT COUNT(*) AS both_side_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = 'PMN' AND status = '0'{df}
                    INTERSECT
                    SELECT public AS wallet FROM pending_refunds WHERE code = 'PMN' AND status = '0'{df}
                ) AS combined_users
            """),
            params,
        )
        both_side = result.scalar() or 0

        return {
            "kpis": [
                {"key": "total_users", "label": "تعداد کل کاربران منحصر به فرد", "value": int(total_users), "format": "number"},
                {"key": "both_side_users", "label": "کاربران خریدار و فروشنده", "value": int(both_side), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_kpis: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_new_per_month(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT DATE_TRUNC('month', first_buy) AS month, COUNT(*) AS new_users
                FROM (
                    SELECT public_key, MIN(created_at) AS first_buy
                    FROM pending_txes
                    WHERE status = '0' AND code = 'PMN'
                    GROUP BY public_key
                ) AS first_purchases
                WHERE 1=1{df.replace('created_at', 'first_buy')}
                GROUP BY DATE_TRUNC('month', first_buy)
                ORDER BY month
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.month.date()), "value": int(row.new_users)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_new_per_month: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_top_buyers(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT public_key, SUM(amount) AS total_amount, COUNT(*) AS tx_count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'{df}
                GROUP BY public_key
                ORDER BY total_amount DESC
                LIMIT 10
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [
                {"wallet": row.public_key, "total_amount": float(row.total_amount), "tx_count": int(row.tx_count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_top_buyers: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_top_sellers(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT public, SUM(amount) AS total_amount, COUNT(*) AS tx_count
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'{df}
                GROUP BY public
                ORDER BY total_amount DESC
                LIMIT 10
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [
                {"wallet": row.public, "total_amount": float(row.total_amount), "tx_count": int(row.tx_count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_top_sellers: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_activity_distribution(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT
                    CASE
                        WHEN tx_count = 1 THEN '۱'
                        WHEN tx_count BETWEEN 2 AND 5 THEN '۲-۵'
                        WHEN tx_count BETWEEN 6 AND 20 THEN '۶-۲۰'
                        WHEN tx_count BETWEEN 21 AND 100 THEN '۲۱-۱۰۰'
                        ELSE '۱۰۰+'
                    END AS activity_bucket,
                    COUNT(*) AS user_count
                FROM (
                    SELECT public_key, COUNT(*) AS tx_count
                    FROM pending_txes
                    WHERE status = '0' AND code = 'PMN'{df}
                    GROUP BY public_key
                ) AS user_activity
                GROUP BY activity_bucket
                ORDER BY MIN(tx_count)
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [{"name": row.activity_bucket, "value": int(row.user_count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_activity_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_monthly_active(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT DATE_TRUNC('month', created_at) AS month, COUNT(DISTINCT public_key) AS active_users
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'{df}
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.month.date()), "value": int(row.active_users)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_monthly_active: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_buy_sell_comparison(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT
                    COALESCE(b.month, s.month) AS month,
                    COALESCE(b.buy_amount, 0) AS buy_amount,
                    COALESCE(s.sell_amount, 0) AS sell_amount
                FROM (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS buy_amount
                    FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}
                    GROUP BY month
                ) b
                FULL OUTER JOIN (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS sell_amount
                    FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}
                    GROUP BY month
                ) s ON b.month = s.month
                ORDER BY month
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [
                {
                    "month": str(row.month.date()),
                    "buy_amount": float(row.buy_amount) if row.buy_amount else 0,
                    "sell_amount": float(row.sell_amount) if row.sell_amount else 0,
                }
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_buy_sell_comparison: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


PENDING_USERS_FILTERABLE_COLUMNS = {
    "public": "pr.public",
    "national_id": "i.national_id",
    "first_name": "i.first_name",
    "last_name": "i.last_name",
    "iban": "i.iban",
    "cardnumber": "i.cardnumber",
    "mobile": "ku.mobile",
}

PENDING_USERS_SELECT = """
    SELECT
        pr.public,
        i.national_id,
        i.first_name,
        i.last_name,
        i.iban,
        i.cardnumber,
        ku.mobile,
        pr.refund_price,
        pr.amount
"""

PENDING_USERS_FROM = """
    FROM pending_refunds pr
    JOIN federation f ON f.public = pr.public
    JOIN kuknos_user ku ON ku.id = f.user_id
    JOIN identity i ON i.national_id = ku.national_id
    WHERE pr.status = '1'
      AND pr.code = 'PMN'
"""


def _build_pending_filters(filters: Optional[Dict[str, str]]):
    where_clauses: List[str] = []
    params: Dict = {}
    if filters:
        for key, value in filters.items():
            if value and key in PENDING_USERS_FILTERABLE_COLUMNS:
                col = PENDING_USERS_FILTERABLE_COLUMNS[key]
                param_name = f"f_{key}"
                where_clauses.append(f"{col}::text ILIKE :{param_name}")
                params[param_name] = f"%{value}%"
    extra_where = ""
    if where_clauses:
        extra_where = " AND " + " AND ".join(where_clauses)
    return extra_where, params


def _row_to_dict(row):
    return {
        "public": row.public,
        "national_id": row.national_id,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "iban": row.iban,
        "cardnumber": row.cardnumber,
        "mobile": row.mobile,
        "refund_price": float(row.refund_price) if row.refund_price else None,
        "amount": float(row.amount) if row.amount else None,
    }


async def get_pending_users(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    filters: Optional[Dict[str, str]] = None,
) -> Dict:
    try:
        extra_where, params = _build_pending_filters(filters)
        base = PENDING_USERS_FROM + extra_where

        count_result = await session.execute(
            text(f"SELECT COUNT(*) {base}"), params
        )
        total = count_result.scalar() or 0

        offset = (page - 1) * page_size
        params["limit_val"] = page_size
        params["offset_val"] = offset

        result = await session.execute(
            text(f"""
                {PENDING_USERS_SELECT}
                {base}
                ORDER BY pr.refund_price DESC
                LIMIT :limit_val OFFSET :offset_val
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [_row_to_dict(row) for row in rows],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_pending_users: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_pending_users_export(
    session: AsyncSession,
    filters: Optional[Dict[str, str]] = None,
) -> List[Dict]:
    try:
        extra_where, params = _build_pending_filters(filters)
        base = PENDING_USERS_FROM + extra_where

        result = await session.execute(
            text(f"""
                {PENDING_USERS_SELECT}
                {base}
                ORDER BY pr.refund_price DESC
            """),
            params,
        )
        rows = result.fetchall()
        return [_row_to_dict(row) for row in rows]

    except Exception as e:
        logger.error(f"Database error in users_service.get_pending_users_export: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
