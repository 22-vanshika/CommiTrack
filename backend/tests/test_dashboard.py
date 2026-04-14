import pytest
import json
from models import db, Agent, Sale, Commission, Bonus, Clawback
from tests.test_commissions import setup_hierarchy  # Re-use fixture


def test_get_dashboard_summary(client, db, setup_hierarchy):
    """Test the summary statistics endpoint."""
    # --- ARRANGE ---
    agent_id = setup_hierarchy["agent_id"]
    tl_id = setup_hierarchy["team_lead_id"]

    # Create a few sales
    sale1_resp = client.post(
        "/api/sales",
        json={
            "policy_number": "DASH-001",
            "policy_value": 100000,
            "agent_id": agent_id,
        },
    )
    sale1_id = sale1_resp.json["sale_id"]
    sale2_resp = client.post(
        "/api/sales",
        json={"policy_number": "DASH-002", "policy_value": 50000, "agent_id": agent_id},
    )
    sale2_id = sale2_resp.json["sale_id"]

    # Calculate bonuses for the current period
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    period_str = f"{now.year}-{now.month:02d}"
    client.post(
        "/api/bonuses/calculate", json={"period": period_str, "type": "Monthly"}
    )

    # Cancel one sale
    client.put(f"/api/sales/{sale2_id}/cancel")

    # --- ACT ---
    response = client.get("/api/dashboard/summary")

    # --- ASSERT ---
    assert response.status_code == 200
    summary = response.json

    # Check structure
    assert "total_sales_value" in summary
    assert "total_commissions_paid" in summary
    assert "total_bonuses_paid" in summary
    assert "total_clawbacks_value" in summary
    assert "agent_count" in summary

    # Check values (based on our test data)
    # Total Sales: 100k + 50k = 150k (Cancellation doesn't remove value, just marks it)
    assert summary["total_sales_value"] == pytest.approx(150000.00)

    # Commissions:
    # Sale 1 (100k): FYC=50k, TL=2k, Mgr=1.5k, Dir=1k = 54.5k
    # Sale 2 (50k): FYC=25k, TL=1k, Mgr=0.75k, Dir=0.5k = 27.25k
    # Total Commissions = 54.5k + 27.25k = 81.75k
    assert summary["total_commissions_paid"] == pytest.approx(81750.00)

    # Bonuses:
    # Original Volume = 150k -> Agent Platinum (5%) = 7.5k
    # TL Volume = 150k -> TL Silver (3%) = 4.5k
    # Cancel Sale 2 (50k) -> New Volume = 100k
    # Agent Bonus Clawback = (100k * 5%) - 7.5k = 5k - 7.5k = -2.5k
    # TL Bonus Clawback = (100k * 3%) - 4.5k = 3k - 4.5k = -1.5k
    # Total Original Bonuses = 7.5k + 4.5k = 12k
    assert summary["total_bonuses_paid"] == pytest.approx(
        12000.00
    )  # Only original bonuses

    # Clawbacks:
    # Sale 2 Commissions: 27.25k
    # Sale 2 Bonus Impact: Agent=-2.5k, TL=-1.5k = -4k
    # Total Clawbacks = -(27.25k) + (-4k) = -31.25k
    assert summary["total_clawbacks_value"] == pytest.approx(-31250.00)

    # Agent count (Dir, Mgr, TL, Agent = 4)
    assert summary["agent_count"] == 4
