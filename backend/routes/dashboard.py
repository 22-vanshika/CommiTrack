"""
Dashboard routes - summary statistics.
"""
from flask import Blueprint, jsonify, current_app
from sqlalchemy import func, select
from models import db, Agent, Sale, Commission, Bonus, Clawback

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """Provides summary statistics for the dashboard."""
    try:
        total_sales_value = (
            db.session.scalar(select(func.sum(Sale.policy_value))) or 0.0
        )
        total_commissions_paid = (
            db.session.scalar(select(func.sum(Commission.amount))) or 0.0
        )
        total_bonuses_paid = db.session.scalar(select(func.sum(Bonus.amount))) or 0.0
        # Clawbacks are stored as negative values, sum them up
        total_clawbacks_value = (
            db.session.scalar(select(func.sum(Clawback.amount))) or 0.0
        )
        agent_count = db.session.scalar(select(func.count(Agent.id))) or 0

        summary = {
            "total_sales_value": total_sales_value,
            "total_commissions_paid": total_commissions_paid,
            "total_bonuses_paid": total_bonuses_paid,
            "total_clawbacks_value": total_clawbacks_value,
            "agent_count": agent_count,
        }
        return jsonify(summary)

    except Exception as e:
        current_app.logger.error(f"Error fetching dashboard summary: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500
