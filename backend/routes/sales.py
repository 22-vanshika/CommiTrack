"""
Sales routes - sale recording and cancellation.
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select, and_
from models import db, Agent, Sale, Commission, Clawback, Bonus, HierarchySnapshot
from services import (
    COMMISSION_RATES,
    get_upline,
    get_downline_agent_ids,
    get_monthly_sales_volume,
    get_quarterly_sales_volume,
    get_annual_sales_volume,
    get_bonus_rate_for_volume,
)

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("/sales", methods=["POST"])
def create_sale():
    """
    Records a new sale and triggers all commission and snapshot calculations.
    """
    data = request.get_json()

    # Enhanced validation
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    if not data.get("policy_number") or not isinstance(data.get("policy_number"), str):
        return jsonify({"error": "Policy number is required and must be a string"}), 400

    # Check if policy_value exists in data (allowing 0 as a value)
    if "policy_value" not in data or data.get("policy_value") is None:
        return jsonify({"error": "Policy value is required and must be a number"}), 400

    if not isinstance(data.get("policy_value"), (int, float)):
        return jsonify({"error": "Policy value is required and must be a number"}), 400

    if data.get("policy_value") <= 0:
        return jsonify({"error": "Policy value must be greater than zero"}), 400

    if not data.get("agent_id") or not isinstance(data.get("agent_id"), int):
        return jsonify({"error": "Agent ID is required and must be an integer"}), 400

    try:
        # Verify agent exists
        agent = db.session.get(Agent, data["agent_id"])
        if not agent:
            return (
                jsonify({"error": f"Agent with ID {data['agent_id']} not found"}),
                404,
            )

        # Check for duplicate policy number
        existing_sale = (
            db.session.query(Sale)
            .filter_by(policy_number=data["policy_number"])
            .first()
        )
        if existing_sale:
            return (
                jsonify(
                    {"error": f"Policy number {data['policy_number']} already exists"}
                ),
                409,
            )
        # 1. Save the Sale
        new_sale = Sale(
            policy_number=data["policy_number"],
            policy_value=data["policy_value"],
            agent_id=data["agent_id"],
        )
        db.session.add(new_sale)
        # We need the sale_id, so we flush (like a pre-commit)
        db.session.flush()

        # 2. Find the Upline
        selling_agent = db.session.get(Agent, data["agent_id"])
        upline_managers = get_upline(data["agent_id"], db.session)

        all_recipients = [selling_agent] + upline_managers

        # 3. Create the Hierarchy Snapshot
        for i, agent in enumerate(all_recipients):
            snapshot = HierarchySnapshot(
                sale_id=new_sale.id,
                agent_id=agent.id,
                upline_level=i,  # 0 = seller, 1 = first manager, etc.
                upline_agent_id=agent.id,  # Storing the agent's own ID in this snapshot record
            )
            db.session.add(snapshot)

        # 4. Calculate & Save FYC (for the seller)
        fyc_amount = new_sale.policy_value * COMMISSION_RATES["FYC"]
        fyc_commission = Commission(
            amount=fyc_amount,
            commission_type="FYC",
            sale_id=new_sale.id,
            agent_id=selling_agent.id,
        )
        db.session.add(fyc_commission)

        # 5. Calculate & Save Overrides (for the upline)
        for manager in upline_managers:
            rate = COMMISSION_RATES["Override"].get(manager.level)
            if rate:
                override_amount = new_sale.policy_value * rate
                override_commission = Commission(
                    amount=override_amount,
                    commission_type="Override",
                    sale_id=new_sale.id,
                    agent_id=manager.id,
                )
                db.session.add(override_commission)

        # Commit all changes to the database
        db.session.commit()

        return (
            jsonify({"message": "Sale recorded successfully", "sale_id": new_sale.id}),
            201,
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating sale: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while recording the sale"}),
            500,
        )


@sales_bp.route("/sales", methods=["GET"])
def get_sales():
    try:
        # Query all sales, and join with the Agent table to get the agent's name
        # Order by the most recent sale first
        stmt = (
            select(Sale, Agent.name)
            .join(Agent, Sale.agent_id == Agent.id)
            .order_by(Sale.sale_date.desc())
        )

        # .all() will return a list of (Sale, agent_name) tuples
        results = db.session.execute(stmt).all()

        sales_list = []
        for sale, agent_name in results:  # Unpack the tuple here
            sales_list.append(
                {
                    "id": sale.id,
                    "policy_number": sale.policy_number,
                    "policy_value": sale.policy_value,
                    "sale_date": sale.sale_date.isoformat(),
                    "agent_id": sale.agent_id,
                    "agent_name": agent_name,
                    "is_cancelled": sale.is_cancelled,
                }
            )

        return jsonify(sales_list)

    except Exception as e:
        current_app.logger.error(f"Error fetching sales: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while fetching sales"}),
            500,
        )


@sales_bp.route("/sales/<int:sale_id>/cancel", methods=["PUT"])
def cancel_sale(sale_id):
    """
    Marks a sale as cancelled. Creates clawback records for associated
    commissions AND recalculates/creates clawbacks for affected monthly bonuses.
    """
    try:
        # 1. Find the sale
        sale_to_cancel = db.session.get(Sale, sale_id)
        if not sale_to_cancel:
            return jsonify({"error": "Sale not found"}), 404
        if sale_to_cancel.is_cancelled:
            return jsonify({"message": "Policy already marked as cancelled"}), 200

        # --- Cancellation Starts ---
        sale_to_cancel.is_cancelled = True

        # --- Commission Clawback ---
        related_commissions_stmt = select(Commission).where(
            Commission.sale_id == sale_id
        )
        related_commissions = db.session.scalars(related_commissions_stmt).all()

        for commission in related_commissions:
            clawback_record = Clawback(
                amount=-commission.amount,
                original_commission_id=commission.id,
                sale_id=sale_id,
            )
            db.session.add(clawback_record)

        # --- Bonus Clawback/Recalculation (Monthly, Quarterly, Annual) ---
        # Find all agents involved in the original sale (seller + upline)
        # We can use the HierarchySnapshot for this
        snapshot_stmt = select(HierarchySnapshot.agent_id).where(
            HierarchySnapshot.sale_id == sale_id
        )
        affected_agent_ids = db.session.scalars(snapshot_stmt).unique().all()

        # Determine the periods of the sale
        sale_year = sale_to_cancel.sale_date.year
        sale_month = sale_to_cancel.sale_date.month

        # Calculate which quarter the sale falls into
        sale_quarter = (sale_month - 1) // 3 + 1

        # Define periods for each bonus type
        monthly_period = f"{sale_year}-{sale_month:02d}"
        quarterly_period = f"{sale_year}-Q{sale_quarter}"
        annual_period = f"{sale_year}"

        # Process clawbacks for all three bonus types
        bonus_types_and_periods = [
            ("Monthly", monthly_period, sale_year, sale_month, None),
            ("Quarterly", quarterly_period, sale_year, None, sale_quarter),
            ("Annual", annual_period, sale_year, None, None),
        ]

        for bonus_type, period_str, year, month, quarter in bonus_types_and_periods:
            for agent_id in affected_agent_ids:
                agent = db.session.get(Agent, agent_id)
                if not agent:
                    continue  # Skip if agent somehow doesn't exist

                # Find the original bonus calculation for this agent and period
                original_bonus_stmt = select(Bonus).where(
                    and_(
                        Bonus.agent_id == agent_id,
                        Bonus.period == period_str,
                        Bonus.bonus_type == bonus_type,
                    )
                )
                original_bonus = db.session.scalar(original_bonus_stmt)

                if original_bonus:
                    # Recalculate the volume *after* cancellation
                    # Note: volume functions already exclude cancelled sales
                    new_volume = 0
                    agent_ids_to_sum = (
                        [agent.id]
                        if agent.level == 1
                        else get_downline_agent_ids(agent.id, db.session)
                    )

                    # Calculate volume based on bonus type
                    if bonus_type == "Monthly":
                        new_volume = get_monthly_sales_volume(
                            agent_ids_list=agent_ids_to_sum,
                            year=year,
                            month=month,
                            db_session=db.session,
                        )
                    elif bonus_type == "Quarterly":
                        new_volume = get_quarterly_sales_volume(
                            agent_ids_list=agent_ids_to_sum,
                            year=year,
                            quarter=quarter,
                            db_session=db.session,
                        )
                    elif bonus_type == "Annual":
                        new_volume = get_annual_sales_volume(
                            agent_ids_list=agent_ids_to_sum,
                            year=year,
                            db_session=db.session,
                        )

                    # Recalculate the expected bonus amount based on the new volume
                    new_bonus_rate = get_bonus_rate_for_volume(
                        agent.level, new_volume, db.session
                    )
                    new_expected_bonus_amount = new_volume * new_bonus_rate

                    # Calculate the adjustment needed
                    bonus_adjustment = new_expected_bonus_amount - original_bonus.amount

                    # If an adjustment is needed, create a clawback record
                    if (
                        abs(bonus_adjustment) > 0.001
                    ):  # Use a small tolerance for float comparison
                        bonus_clawback = Clawback(
                            amount=bonus_adjustment,  # Store the adjustment (can be negative)
                            original_bonus_id=original_bonus.id,  # Link to the original bonus
                            sale_id=sale_id,  # Link to the sale that triggered it
                        )
                        db.session.add(bonus_clawback)

        # Commit sale cancellation, commission clawbacks, and bonus clawbacks
        db.session.commit()

        return jsonify({"message": "Policy cancelled and clawbacks initiated"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error cancelling sale {sale_id}: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500
