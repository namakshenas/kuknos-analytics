from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, List


async def get_kpis(session: AsyncSession) -> Dict:
    """
    Get all buy-related KPI cards.
    Queries: 1-6 from claude.md
    """
    try:
        # Query 1: Total successful purchases count
        result = await session.execute(
            text("SELECT COUNT(*) AS total_successful_buys FROM pending_txes WHERE status = '0' AND code = 'PMN'")
        )
        total_buys = result.scalar() or 0

        # Query 2: Total volume of PMN bought
        result = await session.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total_pmn_bought FROM pending_txes WHERE status = '0' AND code = 'PMN'")
        )
        total_volume = result.scalar() or 0

        # Query 3: Total revenue in Rials
        result = await session.execute(
            text("SELECT COALESCE(SUM(price), 0) AS total_revenue_rials FROM pending_txes WHERE status = '0' AND code = 'PMN'")
        )
        total_revenue = result.scalar() or 0

        # Query 4: Average purchase amount
        result = await session.execute(
            text("SELECT COALESCE(AVG(amount), 0) AS avg_purchase_amount FROM pending_txes WHERE status = '0' AND code = 'PMN'")
        )
        avg_amount = result.scalar() or 0

        # Query 5: Transaction success rate
        result = await session.execute(
            text("""
                SELECT ROUND(
                    COUNT(*) FILTER (WHERE status = '0') * 100.0 / NULLIF(COUNT(*), 0), 2
                ) AS success_rate
                FROM pending_txes
                WHERE code = 'PMN'
            """)
        )
        success_rate = result.scalar() or 0

        # Query 6: Unique buyers count
        result = await session.execute(
            text("SELECT COUNT(DISTINCT public_key) AS unique_buyers FROM pending_txes WHERE status = '0' AND code = 'PMN'")
        )
        unique_buyers = result.scalar() or 0

        return {
            "kpis": [
                {"key": "total_buys", "label": "تعداد کل خریدها", "value": int(total_buys), "format": "number"},
                {"key": "total_volume", "label": "حجم کل PMN", "value": float(total_volume), "format": "number"},
                {"key": "total_revenue", "label": "مجموع ریالی", "value": int(total_revenue), "format": "rial"},
                {"key": "avg_amount", "label": "میانگین مقدار خرید", "value": float(avg_amount), "format": "decimal"},
                {"key": "success_rate", "label": "نرخ موفقیت", "value": float(success_rate), "format": "percent"},
                {"key": "unique_buyers", "label": "تعداد خریداران منحصر به فرد", "value": int(unique_buyers), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_kpis: {e}")
        raise HTTPException(
            status_code=503,
            detail="خطا در اتصال به پایگاه داده"
        )


async def get_daily_count(session: AsyncSession) -> Dict:
    """Query 7: Daily purchase count (last 12 months)"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                  AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE(created_at)
                ORDER BY day
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {"date": str(row.day), "value": int(row.count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_daily_count: {e}")
        raise HTTPException(
            status_code=503,
            detail="خطا در اتصال به پایگاه داده"
        )


async def get_daily_volume(session: AsyncSession) -> Dict:
    """Query 8: Daily purchase volume in Rials"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE(created_at) AS day, COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                  AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE(created_at)
                ORDER BY day
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {"date": str(row.day), "value": float(row.total_rials)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_daily_volume: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_monthly_trend(session: AsyncSession) -> Dict:
    """Query 9: Monthly purchase trend"""
    try:
        result = await session.execute(
            text("""
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount), 0) AS total_amount,
                    COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {
                    "date": str(row.month.date()),
                    "value": int(row.count),
                    "count": int(row.count),
                    "total_amount": float(row.total_amount),
                    "total_rials": float(row.total_rials),
                }
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_monthly_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_exchange_rate_trend(session: AsyncSession) -> Dict:
    """Query 10: Daily average exchange rate trend"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE(created_at) AS day, AVG(exchange_rate) AS avg_rate
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND exchange_rate > 0
                  AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE(created_at)
                ORDER BY day
            """)
        )
        rows = result.fetchall()

        return {
            "series": [
                {"date": str(row.day), "value": float(row.avg_rate)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_exchange_rate_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_gateway(session: AsyncSession) -> Dict:
    """Query 11: Purchases by gateway"""
    try:
        result = await session.execute(
            text("""
                SELECT gateway, COUNT(*) AS count, SUM(price) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND gateway IS NOT NULL AND gateway != ''
                GROUP BY gateway
                ORDER BY count DESC
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {
                    "name": row.gateway,
                    "value": int(row.count),
                    "count": int(row.count),
                    "total_rials": float(row.total_rials)
                }
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_by_gateway: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_application(session: AsyncSession) -> Dict:
    """Query 12: Purchases by application source"""
    try:
        result = await session.execute(
            text("""
                SELECT application, COUNT(*) AS count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND application IS NOT NULL
                GROUP BY application
                ORDER BY count DESC
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.application, "value": int(row.count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_by_application: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_status_distribution(session: AsyncSession) -> Dict:
    """Query 13: Transaction status distribution"""
    try:
        result = await session.execute(
            text("""
                SELECT status, COUNT(*) AS count
                FROM pending_txes
                WHERE code = 'PMN'
                GROUP BY status
                ORDER BY count DESC
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.status, "value": int(row.count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_status_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_amount_distribution(session: AsyncSession) -> Dict:
    """Query 14: Purchase amount distribution (bucket histogram)"""
    try:
        result = await session.execute(
            text("""
                SELECT
                    CASE
                        WHEN amount <= 10 THEN '۰-۱۰'
                        WHEN amount <= 100 THEN '۱۰-۱۰۰'
                        WHEN amount <= 1000 THEN '۱۰۰-۱٬۰۰۰'
                        WHEN amount <= 10000 THEN '۱٬۰۰۰-۱۰٬۰۰۰'
                        ELSE '۱۰٬۰۰۰+'
                    END AS bucket,
                    COUNT(*) AS count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'
                GROUP BY bucket
                ORDER BY MIN(amount)
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.bucket, "value": int(row.count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_amount_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
