from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.logger import logger
from typing import Dict, List, Optional
from app.services.date_utils import build_date_filter
from app.services.token_utils import DEFAULT_TOKEN, SUPPORTED_TOKENS


async def get_kpis(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT COUNT(DISTINCT wallet) AS total_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = :token AND status = '0'{df}
                    UNION
                    SELECT public AS wallet FROM pending_refunds WHERE code = :token AND status = '0'{df}
                ) AS all_users
            """),
            params,
        )
        total_users = result.scalar() or 0

        result = await session.execute(
            text(f"""
                SELECT COUNT(*) AS both_side_users FROM (
                    SELECT public_key AS wallet FROM pending_txes WHERE code = :token AND status = '0'{df}
                    INTERSECT
                    SELECT public AS wallet FROM pending_refunds WHERE code = :token AND status = '0'{df}
                ) AS combined_users
            """),
            params,
        )
        both_side = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COUNT(DISTINCT public_key) FROM pending_txes WHERE code = :token AND status = '0'{df}"),
            params,
        )
        buyers = result.scalar() or 0

        result = await session.execute(
            text(f"SELECT COUNT(DISTINCT public) FROM pending_refunds WHERE code = :token AND status = '0'{df}"),
            params,
        )
        sellers = result.scalar() or 0

        # The four numbers form a self-checking set:
        #   buyers + sellers - both_side == total_users
        # `total_users` is the UNION (bought or sold) and `both_side` the
        # INTERSECTION (bought and also sold). The old pair showed only those
        # two, which read as "buyers and sellers" — i.e. the sum — rather than
        # "users who are both". Showing all four makes the relationship plain.
        return {
            "kpis": [
                {"key": "total_users", "label": f"تعداد کل کاربران منحصر به فرد ({token})", "value": int(total_users), "format": "number"},
                {"key": "total_buyers", "label": f"تعداد خریداران ({token})", "value": int(buyers), "format": "number"},
                {"key": "total_sellers", "label": f"تعداد فروشندگان ({token})", "value": int(sellers), "format": "number"},
                {"key": "both_side_users", "label": f"کاربران دوطرفه ({token})", "value": int(both_side), "format": "number"},
            ]
        }

    except Exception as e:
        logger.error(f"Database error in users_service.get_kpis: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_new_per_month(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT DATE_TRUNC('month', first_buy) AS month, COUNT(*) AS new_users
                FROM (
                    SELECT public_key, MIN(created_at) AS first_buy
                    FROM pending_txes
                    WHERE status = '0' AND code = :token
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


"""
Top-10 wallets with the account holder's name attached.

Two things this SQL is careful about:

  * The ranking is computed in `top` and the identity tables are joined only
    afterwards, with LEFT JOINs. An inner join would silently drop any wallet
    that has no federation/identity record and quietly change the leaderboard.
  * `federation.public` is not unique (8 duplicates at the time of writing), so
    the join can fan out. `DISTINCT ON (wallet)` collapses it back, guaranteeing
    exactly one row per wallet and never more than ten bars.
"""
_TOP_USERS_CTE = """
WITH top AS (
    SELECT {wallet_col} AS wallet, SUM(amount) AS total_amount, COUNT(*) AS tx_count
    FROM {table}
    WHERE status = '0' AND code = :token{date_filter}
    GROUP BY {wallet_col}
    ORDER BY total_amount DESC
    LIMIT 10
),
named AS (
    SELECT DISTINCT ON (t.wallet)
           t.wallet, t.total_amount, t.tx_count, i.first_name, i.last_name
    FROM top t
    LEFT JOIN federation f ON f.public = t.wallet
    LEFT JOIN kuknos_user ku ON ku.id = f.user_id
    LEFT JOIN identity i ON i.national_id = ku.national_id
    ORDER BY t.wallet, i.last_name NULLS LAST
)
"""


def _top_user_to_dict(row) -> Dict:
    full_name = " ".join(p for p in (row.first_name, row.last_name) if p).strip()
    return {
        "wallet": row.wallet,
        "total_amount": float(row.total_amount),
        "tx_count": int(row.tx_count),
        # None rather than "" so the frontend can fall back to the wallet
        "name": full_name or None,
    }


async def get_top_buyers(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                {_TOP_USERS_CTE.format(
                    wallet_col="public_key", table="pending_txes", date_filter=df
                )}
                SELECT * FROM named ORDER BY total_amount DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {"data": [_top_user_to_dict(row) for row in rows]}

    except Exception as e:
        logger.error(f"Database error in users_service.get_top_buyers: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_top_sellers(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                {_TOP_USERS_CTE.format(
                    wallet_col="public", table="pending_refunds", date_filter=df
                )}
                SELECT * FROM named ORDER BY total_amount DESC
            """),
            params,
        )
        rows = result.fetchall()

        return {"data": [_top_user_to_dict(row) for row in rows]}

    except Exception as e:
        logger.error(f"Database error in users_service.get_top_sellers: {e}")
        raise HTTPException(status_code=503, detail="خطا در اتصال به پایگاه داده")


async def get_activity_distribution(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

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
                    WHERE status = '0' AND code = :token{df}
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


async def get_monthly_active(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT DATE_TRUNC('month', created_at) AS month, COUNT(DISTINCT public_key) AS active_users
                FROM pending_txes
                WHERE status = '0' AND code = :token{df}
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


async def get_buy_sell_comparison(session: AsyncSession, start_date: Optional[str] = None, end_date: Optional[str] = None,
                   token: str = DEFAULT_TOKEN) -> Dict:
    try:
        df, params = build_date_filter(start_date, end_date)
        params["token"] = token

        result = await session.execute(
            text(f"""
                SELECT
                    COALESCE(b.month, s.month) AS month,
                    COALESCE(b.buy_amount, 0) AS buy_amount,
                    COALESCE(s.sell_amount, 0) AS sell_amount
                FROM (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS buy_amount
                    FROM pending_txes WHERE status = '0' AND code = :token{df}
                    GROUP BY month
                ) b
                FULL OUTER JOIN (
                    SELECT DATE_TRUNC('month', created_at) AS month, SUM(amount) AS sell_amount
                    FROM pending_refunds WHERE status = '0' AND code = :token{df}
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
    "token": "pr.code",
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
        pr.code AS token,
        pr.public,
        i.national_id,
        i.first_name,
        i.last_name,
        i.iban,
        i.cardnumber,
        ku.mobile,
        pr.refund_price,
        pr.amount,
        pr.updated_at
"""

# The pending table spans every token exposed in the dropdowns, so each row reports its own code.
_PENDING_TOKEN_BINDS = ", ".join(f":pending_token_{i}" for i in range(len(SUPPORTED_TOKENS)))
_PENDING_TOKEN_PARAMS = {f"pending_token_{i}": t for i, t in enumerate(SUPPORTED_TOKENS)}

PENDING_USERS_FROM = f"""
    FROM pending_refunds pr
    JOIN federation f ON f.public = pr.public
    JOIN kuknos_user ku ON ku.id = f.user_id
    JOIN identity i ON i.national_id = ku.national_id
    WHERE pr.status = '1'
      AND pr.code IN ({_PENDING_TOKEN_BINDS})
"""


def _build_pending_filters(filters: Optional[Dict[str, str]]):
    where_clauses: List[str] = []
    params: Dict = dict(_PENDING_TOKEN_PARAMS)
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
        "token": row.token,
        "public": row.public,
        "national_id": row.national_id,
        "first_name": row.first_name,
        "last_name": row.last_name,
        "iban": row.iban,
        "cardnumber": row.cardnumber,
        "mobile": row.mobile,
        "refund_price": float(row.refund_price) if row.refund_price else None,
        "amount": float(row.amount) if row.amount else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
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
