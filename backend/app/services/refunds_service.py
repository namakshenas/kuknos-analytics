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
            text(f"SELECT COUNT(*) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        total_completed = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COUNT(*) AS total FROM pending_refunds WHERE status = '1' AND code = 'PMN'{df}"), params
        )
        total_pending = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(amount), 0) AS total FROM pending_refunds WHERE status = '1' AND code = 'PMN'{df}"), params
        )
        total_num_pmn_pending = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(total_price), 0) AS total FROM pending_refunds WHERE status = '1' AND code = 'PMN'{df}"), params
        )
        pending_amount = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(amount), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        total_sold = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(refund_price), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        total_payout = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(fee_price), 0) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        total_fees = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(AVG(amount), 0) AS avg FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        avg_amount = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COUNT(DISTINCT public) AS total FROM pending_refunds WHERE status = '0' AND code = 'PMN'{df}"), params
        )
        unique_sellers = result.scalar() or 0

        return {
            "kpis": [
                {"key": "total_completed", "label": "تعداد بازپرداخت‌های تکمیل شده", "value": int(total_completed), "format": "number"},
                {"key": "total_pending", "label": "تعداد بازپرداخت‌های در انتظار", "value": int(total_pending), "format": "number"},
                {"key": "total_num_pmn_pending", "label": "حجم کل PMN در انتظار پرداخت", "value": int(total_num_pmn_pending), "format": "number"},
                {"key": "pending_amount", "label": "مجموع بازپرداخت‌های در انتظار", "value": int(pending_amount), "format": "rial"},
                {"key": "total_sold", "label": "حجم کل PMN فروخته شده", "value": float(total_sold), "format": "number"},
                {"key": "total_payout", "label": "مجموع پرداختی (ریال)", "value": int(total_payout), "format": "rial"},
                {"key": "total_fees", "label": "مجموع کارمزد", "value": int(total_fees), "format": "rial"},
                {"key": "avg_amount", "label": "میانگین مقدار بازپرداخت", "value": float(avg_amount), "format": "decimal"},
                {"key": "unique_sellers", "label": "تعداد فروشندگان منحصر به فرد", "value": int(unique_sellers), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_kpis: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_daily_count(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'{time_filter}
                GROUP BY DATE(created_at)
                ORDER BY day
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.day), "value": int(row.count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_daily_count: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_monthly_trend(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount), 0) AS total_amount,
                    COALESCE(SUM(refund_price), 0) AS total_rials
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'{df}
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """),
            params,
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


async def get_rate_trend(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, AVG(refund_rate) AS avg_rate
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN' AND refund_rate > 0{time_filter}
                GROUP BY DATE(created_at)
                ORDER BY day
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.day), "value": float(row.avg_rate)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_rate_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_rate_candlestick(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT
                    DATE(created_at) AS day,
                    (ARRAY_AGG(refund_rate ORDER BY created_at ASC))[1] AS open,
                    (ARRAY_AGG(refund_rate ORDER BY created_at DESC))[1] AS close,
                    MIN(refund_rate) AS low,
                    MAX(refund_rate) AS high
                FROM pending_refunds
                WHERE status IN ('0', '1') AND code = 'PMN' AND refund_rate > 0{time_filter}
                GROUP BY DATE(created_at)
                ORDER BY day
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [
                {
                    "date": str(row.day),
                    "open": float(row.open),
                    "close": float(row.close),
                    "low": float(row.low),
                    "high": float(row.high),
                }
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_rate_candlestick: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_status_distribution(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT
                    status,
                    CASE
                        WHEN status = '0' THEN 'تکمیل شده (پرداخت شده)'
                        WHEN status = '1' THEN 'در انتظار'
                        ELSE status
                    END AS status_label,
                    COUNT(*) AS count
                FROM pending_refunds
                WHERE code = 'PMN' AND status IN ('0', '1'){df}
                GROUP BY status
                ORDER BY status
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [{"name": row.status_label, "value": int(row.count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_status_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_bank(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT destination_bank_name, COUNT(*) AS count, SUM(refund_price) AS total_rials
                FROM pending_refunds
                WHERE status = '0' AND code = 'PMN'
                  AND destination_bank_name IS NOT NULL AND destination_bank_name != ''{df}
                GROUP BY destination_bank_name
                ORDER BY count DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.destination_bank_name, "value": int(row.count), "count": int(row.count), "total_rials": float(row.total_rials)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_by_bank: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_amount_distribution(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
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
                WHERE status = '0' AND code = 'PMN'{df}
                GROUP BY bucket
                ORDER BY MIN(amount)
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [{"name": row.bucket, "value": int(row.count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in refunds_service.get_amount_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
