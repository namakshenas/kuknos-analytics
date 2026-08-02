from typing import Optional
from fastapi import HTTPException

# Tokens exposed in the UI dropdowns (buys & refunds pages).
SUPPORTED_TOKENS = ("PMN", "IRT", "DAYADIAMOND")
DEFAULT_TOKEN = "PMN"

# Price series in `market_parameters_minutes` used for the buy-fee calculation.
# Only PMN has a documented fee formula (fee = amount * floor(0.02 * ND price)).
FEE_PRICE_SERIES = {"PMN": "ND"}


def resolve_token(token: Optional[str] = None) -> str:
    """Validate a token code coming from the API, falling back to PMN."""
    if not token:
        return DEFAULT_TOKEN
    normalized = token.strip().upper()
    if normalized not in SUPPORTED_TOKENS:
        raise HTTPException(status_code=400, detail=f"توکن نامعتبر است: {token}")
    return normalized
