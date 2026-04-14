"""
Bonus routes - bonus calculation and retrieval.
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func, select, and_
from models import db, Agent, Bonus
from services import (
    get_downline_agent_ids,
    get_monthly_sales_volume,
    get_quarterly_sales_volume,
    get_annual_sales_volume,
    get_bonus_rate_for_volume,
)

bonuses_bp = Blueprint("bonuses", __name__)


@bonuses_bp.route("/bonuses/calculate", methods=["POST"])
def calculate_bonuses():
    """Calculates and saves bonuses for Monthly, Quarterly, or Annual periods."""
    data = request.get_json()
    period_str = data.get("period")  # e.g., "2025-10", "2026-Q1", "2027"
    bonus_type = data.get("type")  # e.g., "Monthly", "Quarterly", "Annual"

    # Validate bonus_type
    if bonus_type not in ["Monthly", "Quarterly", "Annual"]:
        return (
            jsonify(
                {"error": "Invalid bonus type. Use Monthly, Quarterly, or Annual."}
            ),
            400,
        )
    if not period_str:
        return jsonify({"error": "Period string is required."}), 400

    # Parse period string based on type
    year, month, quarter = None, None, None
    try:
        if bonus_type == "Monthly":
            year, month = map(int, period_str.split("-"))
            if not (1 <= month <= 12):
                raise ValueError("Invalid month")
        elif bonus_type == "Quarterly":
            year_str, q_str = period_str.split("-")
            year = int(year_str)
            quarter = int(q_str[1:])  # Extract number from Q1, Q2 etc.
            if not (1 <= quarter <= 4):
                raise ValueError("Invalid quarter")
        elif bonus_type == "Annual":
            year = int(period_str)
    except (ValueError, IndexError):
        return (
            jsonify(
                {
                    "error": f"Invalid period format for {bonus_type}. Use YYYY-MM, YYYY-Q#, or YYYY."
                }
            ),
            400,
        )

    try:
        all_agents_stmt = select(Agent)
        all_agents = db.session.scalars(all_agents_stmt).all()

        bonuses_created_count = 0
        bonuses_updated_count = 0

        for agent in all_agents:
            volume = 0
            agent_ids_to_sum = []  # List of IDs for volume calculation

            # Determine volume scope (personal or downline) and calculate
            if agent.level == 1:
                agent_ids_to_sum = [agent.id]  # Level 1 uses personal sales
            else:
                agent_ids_to_sum = get_downline_agent_ids(
                    agent.id, db.session
                )  # Others use downline

            # Calculate volume based on bonus type
            if bonus_type == "Monthly":
                volume = get_monthly_sales_volume(
                    agent_ids_to_sum, year, month, db.session
                )
            elif bonus_type == "Quarterly":
                volume = get_quarterly_sales_volume(
                    agent_ids_to_sum, year, quarter, db.session
                )
            elif bonus_type == "Annual":
                volume = get_annual_sales_volume(agent_ids_to_sum, year, db.session)

            if volume > 0:
                bonus_rate = get_bonus_rate_for_volume(agent.level, volume, db.session)
                if bonus_rate > 0:
                    bonus_amount = volume * bonus_rate

                    # Check if bonus exists and Save/Update
                    existing_bonus_stmt = select(Bonus).where(
                        and_(
                            Bonus.agent_id == agent.id,
                            Bonus.period == period_str,
                            Bonus.bonus_type == bonus_type,
                        )
                    )
                    existing_bonus = db.session.scalar(existing_bonus_stmt)

                    if existing_bonus:
                        existing_bonus.amount = bonus_amount
                        bonuses_updated_count += 1
                    else:
                        new_bonus = Bonus(
                            amount=bonus_amount,
                            bonus_type=bonus_type,
                            period=period_str,
                            agent_id=agent.id,
                        )
                        db.session.add(new_bonus)
                        bonuses_created_count += 1

        db.session.commit()
        return (
            jsonify(
                {
                    "message": f"{bonus_type} bonuses calculated for {period_str}. Created: {bonuses_created_count}, Updated: {bonuses_updated_count}"
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error calculating bonuses: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500


@bonuses_bp.route("/bonuses", methods=["GET"])
def get_bonuses():
    """Fetches calculated bonuses, joining with agent names."""
    try:
        # Query bonuses and join with Agent to get names
        # Order by period descending, then agent name
        stmt = (
            select(Bonus, Agent.name)
            .join(Agent, Bonus.agent_id == Agent.id)
            .order_by(Bonus.period.desc(), Agent.name)
        )
        results = db.session.execute(stmt).all()

        bonuses_list = []
        for bonus, agent_name in results:
            bonuses_list.append(
                {
                    "id": bonus.id,
                    "amount": bonus.amount,
                    "bonus_type": bonus.bonus_type,
                    "period": bonus.period,
                    "agent_id": bonus.agent_id,
                    "agent_name": agent_name,
                }
            )
        return jsonify(bonuses_list)

    except Exception as e:
        current_app.logger.error(f"Error fetching bonuses: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while fetching bonuses"}),
            500,
        )
