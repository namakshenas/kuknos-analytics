from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, Optional
from app.services.date_utils import build_date_filter
import numpy as np


async def get_kpis(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"SELECT COUNT(*) AS total_successful_buys FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}"),
            params,
        )
        total_buys = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(amount), 0) AS total_pmn_bought FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}"),
            params,
        )
        total_volume = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(price), 0) AS total_revenue_rials FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}"),
            params,
        )
        total_revenue = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(AVG(amount), 0) AS avg_purchase_amount FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}"),
            params,
        )
        avg_amount = result.scalar() or 0

        # Calculate total buys fee using ND prices from market_parameters_minutes
        # Fee per token = floor(0.02 * ND), total fee per tx = amount * floor(0.02 * ND)
        tx_result = await session.execute(
            text(f"""
                SELECT created_at, amount
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'{df}
                ORDER BY created_at
            """),
            params,
        )
        tx_rows = tx_result.fetchall()

        nd_result = await session.execute(
            text("""
                SELECT last_update, price
                FROM market_parameters_minutes
                WHERE name = 'ND'
                ORDER BY last_update
            """)
        )
        nd_rows = nd_result.fetchall()

        total_buys_fee = 0
        if tx_rows and nd_rows:
            nd_timestamps = np.array([row.last_update.timestamp() for row in nd_rows])
            nd_prices = np.array([float(row.price) for row in nd_rows])

            tx_timestamps = np.array([row.created_at.timestamp() for row in tx_rows])
            tx_amounts = np.array([float(row.amount) for row in tx_rows])

            # Find closest ND index for each transaction
            indices = np.searchsorted(nd_timestamps, tx_timestamps, side='right') - 1
            indices = np.clip(indices, 0, len(nd_timestamps) - 1)

            # For boundary cases, check if the next index is actually closer
            next_indices = np.minimum(indices + 1, len(nd_timestamps) - 1)
            diff_left = np.abs(tx_timestamps - nd_timestamps[indices])
            diff_right = np.abs(tx_timestamps - nd_timestamps[next_indices])
            closest_indices = np.where(diff_right < diff_left, next_indices, indices)

            closest_nd_prices = nd_prices[closest_indices]
            fee_per_token = np.floor(0.02 * closest_nd_prices)
            total_buys_fee = int(np.sum(tx_amounts * fee_per_token))

        result = await session.execute(
            text(f"SELECT COUNT(DISTINCT public_key) AS unique_buyers FROM pending_txes WHERE status = '0' AND code = 'PMN'{df}"),
            params,
        )
        unique_buyers = result.scalar() or 0

        return {
            "kpis": [
                {"key": "total_buys", "label": "تعداد کل خریدها", "value": int(total_buys), "format": "number"},
                {"key": "total_volume", "label": "حجم کل PMN", "value": float(total_volume), "format": "number"},
                {"key": "total_revenue", "label": "مجموع ریالی", "value": int(total_revenue), "format": "rial"},
                {"key": "avg_amount", "label": "میانگین مقدار خرید", "value": float(avg_amount), "format": "decimal"},
                {"key": "total_buys_fee", "label": "مجموع کارمزد", "value": int(total_buys_fee), "format": "rial"},
                {"key": "unique_buyers", "label": "تعداد خریداران منحصر به فرد", "value": int(unique_buyers), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_kpis: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_daily_count(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM pending_txes
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
        logger.error(f"Database error in buys_service.get_daily_count: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_daily_volume(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN'{time_filter}
                GROUP BY DATE(created_at)
                ORDER BY day
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.day), "value": float(row.total_rials)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_daily_volume: {e}")
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
                    COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
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
        logger.error(f"Database error in buys_service.get_monthly_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_exchange_rate_trend(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, AVG(exchange_rate) AS avg_rate
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND exchange_rate > 0{time_filter}
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
        logger.error(f"Database error in buys_service.get_exchange_rate_trend: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_gateway(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT gateway, COUNT(*) AS count, SUM(price) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND gateway IS NOT NULL AND gateway != ''{df}
                GROUP BY gateway
                ORDER BY count DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [
                {"name": row.gateway, "value": int(row.count), "count": int(row.count), "total_rials": float(row.total_rials)}
                for row in rows
            ]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_by_gateway: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_by_application(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT application, COUNT(*) AS count
                FROM pending_txes
                WHERE status = '0' AND code = 'PMN' AND application IS NOT NULL{df}
                GROUP BY application
                ORDER BY count DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [{"name": row.application, "value": int(row.count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_by_application: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_status_distribution(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)

        result = await session.execute(
            text(f"""
                SELECT status, COUNT(*) AS count
                FROM pending_txes
                WHERE code = 'PMN'{df}
                GROUP BY status
                ORDER BY count DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "data": [{"name": row.status, "value": int(row.count)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_status_distribution: {e}")
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
                FROM pending_txes
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
        logger.error(f"Database error in buys_service.get_amount_distribution: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
