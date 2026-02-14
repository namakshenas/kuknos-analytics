from typing import Optional, Tuple, Dict
from datetime import date, timedelta


def build_date_filter(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    column: str = "created_at",
) -> Tuple[str, Dict]:
    """Build SQL date filter clause and params dict."""
    parts = []
    params = {}
    if start_date:
        parts.append(f"{column} >= :start_date")
        params["start_date"] = date.fromisoformat(start_date)
    if end_date:
        parts.append(f"{column} < :end_date")
        params["end_date"] = date.fromisoformat(end_date) + timedelta(days=1)
    return (" AND " + " AND ".join(parts)) if parts else "", params
