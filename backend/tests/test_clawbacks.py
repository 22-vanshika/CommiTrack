import pytest
import json
from models import db, Agent, Sale, Commission, Clawback, HierarchySnapshot

# Re-use the hierarchy setup fixture from commissions test
from tests.test_commissions import setup_hierarchy


def test_cancel_policy_and_create_commission_clawbacks(client, db, setup_hierarchy):
    """
    Test cancelling a policy:
    1. Sets Sale.is_cancelled to True.
    2. Creates negative Clawback records for all original Commissions (FYC & Overrides).
    """
    # === 1. ARRANGE ===
    agent_id = setup_hierarchy["agent_id"]
    sale_data = {
        "policy_number": "POL-CLAWBACK-1",
        "policy_value": 50000.00,  # $50k policy
        "agent_id": agent_id,
    }

    # Create the initial sale and its commissions using the existing API
    create_sale_resp = client.post("/api/sales", json=sale_data)
    assert create_sale_resp.status_code == 201
    sale_id = create_sale_resp.json["sale_id"]

    # Verify initial commissions were created (1 FYC + 3 Overrides = 4)
    initial_commissions = db.session.query(Commission).filter_by(sale_id=sale_id).all()
    assert len(initial_commissions) == 4

    # Calculate expected original commission amounts
    expected_fyc = 50000.00 * 0.50  # 25000
    expected_tl_override = 50000.00 * 0.02  # 1000
    expected_mgr_override = 50000.00 * 0.015  # 750
    expected_dir_override = 50000.00 * 0.01  # 500

    # === 2. ACT ===
    # Cancel the policy using a new endpoint
    cancel_resp = client.put(f"/api/sales/{sale_id}/cancel")

    # === 3. ASSERT ===
    # --- Assert 3a: Cancellation API was successful
    assert cancel_resp.status_code == 200
    assert cancel_resp.json["message"] == "Policy cancelled and clawbacks initiated"

    # --- Assert 3b: Sale object is marked as cancelled
    cancelled_sale = db.session.get(Sale, sale_id)
    assert cancelled_sale is not None
    assert cancelled_sale.is_cancelled is True

    # --- Assert 3c: Clawback records created for commissions
    clawback_records = db.session.query(Clawback).filter_by(sale_id=sale_id).all()
    assert len(clawback_records) == 4  # One clawback per original commission

    # Check clawback amounts negate original commissions
    total_clawback = sum(c.amount for c in clawback_records)
    expected_total_commission = (
        expected_fyc
        + expected_tl_override
        + expected_mgr_override
        + expected_dir_override
    )
    assert total_clawback == pytest.approx(-expected_total_commission)

    # Check individual clawback records link correctly
    for commission in initial_commissions:
        clawback = next(
            (c for c in clawback_records if c.original_commission_id == commission.id),
            None,
        )
        assert clawback is not None
        assert clawback.amount == pytest.approx(-commission.amount)
        assert clawback.original_bonus_id is None  # No bonus clawback yet


# backend/tests/test_clawbacks.py
# ... (keep existing imports and previous test function) ...
from models import Bonus, PerformanceTier  # Add Bonus and PerformanceTier
from datetime import datetime, timezone  # Add datetime and timezone


def test_cancel_policy_and_create_bonus_clawback(client, db, setup_hierarchy):
    """
    Test cancelling a policy correctly creates a clawback record
    linked to the affected monthly bonus.
    """
    # === 1. ARRANGE ===
    agent_id = setup_hierarchy["agent_id"]  # Sarah (Level 1)

    # A) Create sales sufficient for a bonus (e.g., $110k -> Platinum 5%)
    sales_payloads = [
        {
            "policy_number": "POL-BONUS-A",
            "policy_value": 60000.00,
            "agent_id": agent_id,
        },
        {
            "policy_number": "POL-BONUS-B",
            "policy_value": 50000.00,
            "agent_id": agent_id,
        },  # This sale will be cancelled
    ]
    sale_ids = []
    for payload in sales_payloads:
        sale_resp = client.post("/api/sales", json=payload)
        assert sale_resp.status_code == 201
        sale_ids.append(sale_resp.json["sale_id"])

    sale_to_cancel_id = sale_ids[1]  # ID of POL-BONUS-B

    # B) Calculate the monthly bonus for the current period
    now = datetime.now(timezone.utc)
    period_str = f"{now.year}-{now.month:02d}"
    bonus_calc_resp = client.post(
        "/api/bonuses/calculate", json={"period": period_str, "type": "Monthly"}
    )
    assert bonus_calc_resp.status_code == 200

    # Verify the initial bonus was created
    initial_bonus = (
        db.session.query(Bonus).filter_by(agent_id=agent_id, period=period_str).first()
    )
    assert initial_bonus is not None
    # Expected Bonus: $110k * 5% = $5500
    assert initial_bonus.amount == pytest.approx(5500.00)
    initial_bonus_id = initial_bonus.id

    # === 2. ACT ===
    # Cancel the second sale (POL-BONUS-B, $50k value)
    cancel_resp = client.put(f"/api/sales/{sale_to_cancel_id}/cancel")
    assert cancel_resp.status_code == 200  # Verify cancellation worked

    # === 3. ASSERT ===
    # --- Assert 3a: Commission Clawbacks Created (Verify previous logic still works)
    comm_clawbacks = (
        db.session.query(Clawback)
        .filter(
            Clawback.sale_id == sale_to_cancel_id,
            Clawback.original_commission_id != None,
        )
        .all()
    )
    assert len(comm_clawbacks) == 4  # Should still create commission clawbacks

    # --- Assert 3b: Bonus Clawback Created
    bonus_clawback = (
        db.session.query(Clawback)
        .filter_by(
            sale_id=sale_to_cancel_id,
            original_bonus_id=initial_bonus_id,  # Check link to original bonus
        )
        .first()
    )

    assert bonus_clawback is not None
    assert bonus_clawback.original_commission_id is None  # Make sure it's not mixed up

    # --- Assert 3c: Bonus Clawback Amount Calculation ---
    # Original Volume = 110k (Platinum @ 5%) -> Bonus $5500
    # Cancelled Sale Value = 50k
    # New Volume = 60k (Gold @ 3%) -> New *expected* bonus = $1800
    # Bonus Clawback Amount = New Expected Bonus - Original Bonus
    # Bonus Clawback Amount = $1800 - $5500 = -$3700
    # The clawback record should store the negative adjustment needed.
    assert bonus_clawback.amount == pytest.approx(-3700.00)
