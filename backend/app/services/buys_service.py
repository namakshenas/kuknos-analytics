from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, Optional
from app.services.date_utils import build_date_filter
from app.services.token_utils import DEFAULT_TOKEN, FEE_PRICE_SERIES
import numpy as np


def buys_fee_label(token: str) -> str:
    """Shared so the lazy placeholder and the resolved value agree."""
    return f"مجموع کارمزد خرید ({token})"


async def get_kpis(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"SELECT COUNT(*) AS total_successful_buys FROM pending_txes WHERE status = '0' AND code = :token{df}"),
            params,
        )
        total_buys = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(amount), 0) AS total_bought FROM pending_txes WHERE status = '0' AND code = :token{df}"),
            params,
        )
        total_volume = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(SUM(price), 0) AS total_revenue_rials FROM pending_txes WHERE status = '0' AND code = :token{df}"),
            params,
        )
        total_revenue = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COALESCE(AVG(amount), 0) AS avg_purchase_amount FROM pending_txes WHERE status = '0' AND code = :token{df}"),
            params,
        )
        avg_amount = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COUNT(DISTINCT public_key) AS unique_buyers FROM pending_txes WHERE status = '0' AND code = :token{df}"),
            params,
        )
        unique_buyers = result.scalar() or 0

        # Every label carries the selected token, so a card is never ambiguous
        # once it has been read out of context (or exported / screenshotted).
        kpis = [
            {"key": "total_buys", "label": f"تعداد کل خریدها ({token})", "value": int(total_buys), "format": "number"},
            {"key": "total_volume", "label": f"حجم کل خریداری شده ({token})", "value": float(total_volume), "format": "number"},
            {"key": "total_revenue", "label": f"مجموع ریالی خریدها ({token})", "value": int(total_revenue), "format": "rial"},
            {"key": "avg_amount", "label": f"میانگین مقدار خرید ({token})", "value": float(avg_amount), "format": "decimal"},
        ]

        # The fee formula depends on a token-specific price series; only PMN has
        # one. The label must match get_total_buys_fee's exactly, or it would
        # visibly change when the lazily-loaded value patches the card.
        if token in FEE_PRICE_SERIES:
            kpis.append(
                {"key": "total_buys_fee", "label": buys_fee_label(token), "value": None, "format": "rial", "lazy": True}
            )

        kpis.append(
            {"key": "unique_buyers", "label": f"تعداد خریداران منحصر به فرد ({token})", "value": int(unique_buyers), "format": "number"}
        )

        return {"kpis": kpis}

    except Exception as e:
        logger.error(f"Database error in buys_service.get_kpis: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_daily_count(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, COALESCE(SUM(amount), 0) AS total_amount
                FROM pending_txes
                WHERE status = '0' AND code = :token{time_filter}
                GROUP BY DATE(created_at)
                ORDER BY day
            """),
            params,
        )
        rows = result.fetchall()

        return {
            "series": [{"date": str(row.day), "value": float(row.total_amount)} for row in rows]
        }

    except Exception as e:
        logger.error(f"Database error in buys_service.get_daily_count: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_daily_volume(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = :token{time_filter}
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


async def get_monthly_trend(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS count,
                    COALESCE(SUM(amount), 0) AS total_amount,
                    COALESCE(SUM(price), 0) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = :token{df}
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


async def get_exchange_rate_trend(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token
        time_filter = df if df else " AND created_at >= NOW() - INTERVAL '12 months'"

        result = await session.execute(
            text(f"""
                SELECT DATE(created_at) AS day, AVG(exchange_rate) AS avg_rate
                FROM pending_txes
                WHERE status = '0' AND code = :token AND exchange_rate > 0{time_filter}
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


async def get_by_gateway(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT gateway, COUNT(*) AS count, SUM(price) AS total_rials
                FROM pending_txes
                WHERE status = '0' AND code = :token AND gateway IS NOT NULL AND gateway != ''{df}
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


async def get_by_application(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT application, COUNT(*) AS count
                FROM pending_txes
                WHERE status = '0' AND code = :token AND application IS NOT NULL{df}
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


async def get_status_distribution(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT status, COUNT(*) AS count
                FROM pending_txes
                WHERE code = :token{df}
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


async def get_amount_distribution(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

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
                WHERE status = '0' AND code = :token{df}
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


async def get_total_buys_fee(
    session: AsyncSession,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = DEFAULT_TOKEN,
) -> Dict:
    """Expensive KPI: calculates total buy fees using the token's price series in market_parameters_minutes."""
    price_series = FEE_PRICE_SERIES.get(token)
    if price_series is None:
        raise HTTPException(status_code=400, detail=f"محاسبه کارمزد برای توکن {token} پشتیبانی نمی‌شود")

    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        tx_result = await session.execute(
            text(f"""
                SELECT created_at, amount
                FROM pending_txes
                WHERE status = '0' AND code = :token{df}
                ORDER BY created_at
            """),
            params,
        )
        tx_rows = tx_result.fetchall()

        nd_result = await session.execute(
            text("""
                SELECT last_update, price
                FROM market_parameters_minutes
                WHERE name = :price_series
                ORDER BY last_update
            """),
            {"price_series": price_series},
        )
        nd_rows = nd_result.fetchall()

        total_buys_fee = 0
        if tx_rows and nd_rows:
            nd_timestamps = np.array([row.last_update.timestamp() for row in nd_rows])
            nd_prices = np.array([float(row.price) for row in nd_rows])

            tx_timestamps = np.array([row.created_at.timestamp() for row in tx_rows])
            tx_amounts = np.array([float(row.amount) for row in tx_rows])

            indices = np.searchsorted(nd_timestamps, tx_timestamps, side='right') - 1
            indices = np.clip(indices, 0, len(nd_timestamps) - 1)

            next_indices = np.minimum(indices + 1, len(nd_timestamps) - 1)
            diff_left = np.abs(tx_timestamps - nd_timestamps[indices])
            diff_right = np.abs(tx_timestamps - nd_timestamps[next_indices])
            closest_indices = np.where(diff_right < diff_left, next_indices, indices)

            closest_nd_prices = nd_prices[closest_indices]
            fee_per_token = np.floor(0.02 * closest_nd_prices)
            total_buys_fee = int(np.sum(tx_amounts * fee_per_token))

        return {
            "kpi": {"key": "total_buys_fee", "label": buys_fee_label(token), "value": int(total_buys_fee), "format": "rial"}
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error in buys_service.get_total_buys_fee: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")
