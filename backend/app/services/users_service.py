from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, Optional
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
