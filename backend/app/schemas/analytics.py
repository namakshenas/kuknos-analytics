from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime


class KPIItem(BaseModel):
    """Individual KPI card data"""

    key: str
    label: str
    value: Optional[float | int] = None
    format: Literal["number", "rial", "percent", "decimal"]
    lazy: Optional[bool] = None


class KPIResponse(BaseModel):
    """Response model for KPI endpoints"""

    kpis: List[KPIItem]


class SeriesPoint(BaseModel):
    """Single data point in a time series"""

    date: str
    value: float | int
    count: Optional[int] = None
    total_amount: Optional[float] = None
    total_rials: Optional[float] = None


class SeriesResponse(BaseModel):
    """Response model for time series endpoints"""

    series: List[SeriesPoint]


class DistributionItem(BaseModel):
    """Single item in a distribution chart"""

    name: str
    value: float | int
    count: Optional[int] = None
    total_rials: Optional[float] = None


class DistributionResponse(BaseModel):
    """Response model for distribution endpoints"""

    data: List[DistributionItem]


class ErrorResponse(BaseModel):
    """Standardized error response"""

    detail: str
    code: str


class TopUserItem(BaseModel):
    """Top user by volume"""

    wallet: str
    total_amount: float
    tx_count: int


class TopUsersResponse(BaseModel):
    """Response model for top users endpoints"""

    data: List[TopUserItem]


class BuySellComparisonPoint(BaseModel):
    """Monthly buy vs sell comparison data point"""

    month: str
    buy_amount: Optional[float] = 0
    sell_amount: Optional[float] = 0


class BuySellComparisonResponse(BaseModel):
    """Response model for buy/sell comparison"""

    series: List[BuySellComparisonPoint]


class CandlestickPoint(BaseModel):
    """Single OHLC data point for candlestick chart"""

    date: str
    open: float
    close: float
    low: float
    high: float


class CandlestickResponse(BaseModel):
    """Response model for candlestick chart endpoints"""

    series: List[CandlestickPoint]
