from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict


async def get_kpis(session: AsyncSession) -> Dict:
    """
    Get user analytics KPI cards.
    Queries: 28-29 from claude.md
    """
    try:
        # Query 28: Total unique users (union of buyers + sellers)
        result = await session.execute(
            text("""
                SELECT COUNT(DISTINCT wallet) AS total_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = 'PMN' AND status = '0'
                    UNION
                    SELECT public AS wallet FROM pending_refunds WHERE code = 'PMN' AND status = '0'
                ) AS all_users
            """)
        )
        total_users = result.scalar() or 0

        # Query 29: Users who both bought and sold PMN
        result = await session.execute(
            text("""
                SELECT COUNT(*) AS both_side_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = 'PMN' AND status = '0'
                    INTERSECT
                    SELECT public AS wallet FROM pending_refunds WHERE code = 'PMN' AND status = '0'
                ) AS combined_users
            """)
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
        raise HTTPException(
            status_code=503,
            detail="خطا در اتصال به پایگاه داده"
        )


async def get_new_per_month(session: AsyncSession) -> Dict:
    """Query 30: New users per month (first purchase date)"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE_TRUNC('month', first_buy) AS month, COUNT(*) AS new_users
                FROM (
                    SELECT public_key, MIN(created_at) AS first_buy
                    FROM pending_txes
                    WHERE status = '0' AND code = 'PMN'
                    GROUP BY public_key
                ) AS first_purchases
                GROUP BY DATE_TRUNC('month', first_buy)
                ORDER BY month
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {"date": str(row.month.date()), "value": int(row.new_users)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_new_per_month: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_top_buyers(session: AsyncSession) -> Dict:
    """Query 31: Top 10 buyers by volume"""
    try:
        result = await session.execute(
            text("""
                SELECT public_key, SUM(amount) AS total_amount, COUNT(*) AS tx_count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                GROUP BY public_key
                ORDER BY total_amount DESC
                LIMIT 10
            """)
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


async def get_top_sellers(session: AsyncSession) -> Dict:
    """Query 32: Top 10 sellers by volume"""
    try:
        result = await session.execute(
            text("""
                SELECT public, SUM(amount) AS total_amount, COUNT(*) AS tx_count
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'
                GROUP BY public
                ORDER BY total_amount DESC
                LIMIT 10
            """)
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


async def get_activity_distribution(session: AsyncSession) -> Dict:
    """Query 33: User activity distribution (transaction count histogram)"""
    try:
        result = await session.execute(
            text("""
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
                    WHERE status = '0' AND code = 'PMN'
                    GROUP BY public_key
                ) AS user_activity
                GROUP BY activity_bucket
                ORDER BY MIN(tx_count)
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.activity_bucket, "value": int(row.user_count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_activity_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_monthly_active(session: AsyncSession) -> Dict:
    """Query 34: Monthly active users"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE_TRUNC('month', created_at) AS month, COUNT(DISTINCT public_key) AS active_users
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {"date": str(row.month.date()), "value": int(row.active_users)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_monthly_active: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_buy_sell_comparison(session: AsyncSession) -> Dict:
    """Query 35: Buy vs. Sell volume comparison per month"""
    try:
        result = await session.execute(
            text("""
                SELECT
                    COALESCE(b.month, s.month) AS month,
                    COALESCE(b.buy_amount, 0) AS buy_amount,
                    COALESCE(s.sell_amount, 0) AS sell_amount
                FROM (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS buy_amount
                    FROM pending_txes WHERE status = '0' AND code = 'PMN'
                    GROUP BY month
                ) b
                FULL OUTER JOIN (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS sell_amount
                    FROM pending_refunds WHERE status = '0' AND code = 'PMN'
                    GROUP BY month
                ) s ON b.month = s.month
                ORDER BY month
            """)
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
