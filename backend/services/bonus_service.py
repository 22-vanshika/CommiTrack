"""
Bonus calculation services - volume calculations and tier lookups.
"""
from datetime import datetime, timezone
from sqlalchemy import func, select, and_
from models import Sale, PerformanceTier


def get_monthly_sales_volume(agent_ids_list, year, month, db_session):
    """Calculates total sales volume for a list of agents in a given month."""
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list),
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False,
        )
    )
    total_volume = db_session.scalar(stmt)
    return total_volume or 0.0


def get_quarterly_sales_volume(agent_ids_list, year, quarter, db_session):
    """Calculates total sales volume for a list of agents in a given quarter."""
    if quarter == 1:
        start_month, end_month = 1, 3
    elif quarter == 2:
        start_month, end_month = 4, 6
    elif quarter == 3:
        start_month, end_month = 7, 9
    elif quarter == 4:
        start_month, end_month = 10, 12
    else:
        return 0.0  # Invalid quarter

    start_date = datetime(year, start_month, 1, tzinfo=timezone.utc)
    # End date is the start of the next quarter
    if end_month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, end_month + 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list),
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False,
        )
    )
    total_volume = db_session.scalar(stmt)
    return total_volume or 0.0


def get_annual_sales_volume(agent_ids_list, year, db_session):
    """Calculates total sales volume for a list of agents in a given year."""
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)

    stmt = select(func.sum(Sale.policy_value)).where(
        and_(
            Sale.agent_id.in_(agent_ids_list),
            Sale.sale_date >= start_date,
            Sale.sale_date < end_date,
            Sale.is_cancelled == False,
        )
    )
    total_volume = db_session.scalar(stmt)
    return total_volume or 0.0


def get_bonus_rate_for_volume(agent_level, volume, db_session):
    """Finds the bonus rate based on agent level and sales volume."""
    stmt = (
        select(PerformanceTier.bonus_rate)
        .where(
            and_(
                PerformanceTier.agent_level == agent_level,
                PerformanceTier.min_volume <= volume,
                PerformanceTier.max_volume > volume,
            )
        )
        .limit(1)
    )
    rate = db_session.scalar(stmt)
    return rate if rate is not None else 0.0
