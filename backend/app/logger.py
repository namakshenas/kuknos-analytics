from loguru import logger
import sys


def setup_logger():
    """Configure Loguru logger for the application"""
    # Remove default handler
    logger.remove()

    # Console handler with color formatting
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}",
        colorize=True,
    )

    # File handler with rotation
    logger.add(
        "logs/kuknos.log",
        rotation="10 MB",
        retention="7 days",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    )

    logger.info("Logger initialized successfully")
