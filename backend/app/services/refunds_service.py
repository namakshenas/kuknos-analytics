from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict


async def get_kpis(session: AsyncSession) -> Dict:
    """
    Get all refund-related KPI cards.
    Queries: 15-21 from claude.md
    """
    try:
        # Query 15: Total completed refunds
        result = await session.execute(
            text("SELECT COUNT(*) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        total_completed = result.scalar() or 0

        # Query 16: Total pending refunds
        result = await session.execute(
            text("SELECT COUNT(*) AS total FROM pending_refunds WHERE status = '1' AND code = 'PMN'")
        )
        total_pending = result.scalar() or 0

        # Query 17: Total PMN sold (completed)
        result = await session.execute(
            text("SELECT COALESCE(SUM(amount), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        total_sold = result.scalar() or 0

        # Query 18: Total refund payout in Rials
        result = await session.execute(
            text("SELECT COALESCE(SUM(refund_price), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        total_payout = result.scalar() or 0

        # Query 19: Total fees collected
        result = await session.execute(
            text("SELECT COALESCE(SUM(fee_price), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        total_fees = result.scalar() or 0

        # Query 20: Average refund amount
        result = await session.execute(
            text("SELECT COALESCE(AVG(amount), 0) AS avg FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        avg_amount = result.scalar() or 0

        # Query 21: Unique sellers count
        result = await session.execute(
            text("SELECT COUNT(DISTINCT public) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'")
        )
        unique_sellers = result.scalar() or 0

        return {
            "kpis": [
                {"key": "total_completed", "label": "تعداد بازپرداخت‌های تکمیل شده", "value": int(total_completed), "format": "number"},
                {"key": "total_pending", "label": "تعداد بازپرداخت‌های در انتظار", "value": int(total_pending), "format": "number"},
                {"key": "total_sold", "label": "حجم کل PMN فروخته شده", "value": float(total_sold), "format": "number"},
                {"key": "total_payout", "label": "مجموع پرداختی (ریال)", "value": int(total_payout), "format": "rial"},
                {"key": "total_fees", "label": "مجموع کارمزد", "value": int(total_fees), "format": "rial"},
                {"key": "avg_amount", "label": "میانگین مقدار بازپرداخت", "value": float(avg_amount), "format": "decimal"},
                {"key": "unique_sellers", "label": "تعداد فروشندگان منحصر به فرد", "value": int(unique_sellers), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_kpis: {e}")
        raise HTTPException(
            status_code=503,
            detail="خطا در اتصال به پایگاه داده"
        )


async def get_daily_count(session: AsyncSession) -> Dict:
    """Query 22: Daily refund count (last 12 months)"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM pending_refunds
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
        logger.error(f"Database error in refunds_service.get_daily_count: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_monthly_trend(session: AsyncSession) -> Dict:
    """Query 23: Monthly refund trend"""
    try:
        result = await session.execute(
            text("""
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount), 0) AS total_amount,
                    COALESCE(SUM(refund_price), 0) AS total_rials
                FROM pending_refunds
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
        logger.error(f"Database error in refunds_service.get_monthly_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_rate_trend(session: AsyncSession) -> Dict:
    """Query 24: Daily refund rate trend"""
    try:
        result = await session.execute(
            text("""
                SELECT DATE(created_at) AS day, AVG(refund_rate) AS avg_rate
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN' AND refund_rate > 0
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
        logger.error(f"Database error in refunds_service.get_rate_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_status_distribution(session: AsyncSession) -> Dict:
    """Query 25: Refund status distribution (only fully-paid and pending)"""
    try:
        result = await session.execute(
            text("""
                SELECT
                    status,
                    CASE
                        WHEN status = '0' THEN 'تکمیل شده (پرداخت شده)'
                        WHEN status = '1' THEN 'در انتظار'
                        ELSE status
                    END AS status_label,
                    COUNT(*) AS count
                FROM pending_refunds
                WHERE code = 'PMN' AND status IN ('0', '1')
                GROUP BY status
                ORDER BY status
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.status_label, "value": int(row.count)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_status_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_bank(session: AsyncSession) -> Dict:
    """Query 26: Refunds by destination bank"""
    try:
        result = await session.execute(
            text("""
                SELECT destination_bank_name, COUNT(*) AS count, SUM(refund_price) AS total_rials
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'
                  AND destination_bank_name IS NOT NULL AND destination_bank_name != ''
                GROUP BY destination_bank_name
                ORDER BY count DESC
            """)
        )
        rows = result.fetchall()

        return {
            "data": [
                {
                    "name": row.destination_bank_name,
                    "value": int(row.count),
                    "count": int(row.count),
                    "total_rials": float(row.total_rials)
                }
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_by_bank: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_amount_distribution(session: AsyncSession) -> Dict:
    """Query 27: Refund amount distribution (bucket histogram)"""
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
                FROM pending_refunds
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
        logger.error(f"Database error in refunds_service.get_amount_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
