import pytest
import json
from models import db, Agent, Sale, Commission, HierarchySnapshot


# A "fixture" to create our 4-level hierarchy for the test
@pytest.fixture(scope="function")
def setup_hierarchy(db):
    """Creates a 4-level hierarchy for testing commissions."""

    # 1. Create Director (Level 4)
    director = Agent(name="Mike (Director)", level=4, parent_id=None)
    db.session.add(director)
    db.session.flush()  # Flush to get director.id

    # 2. Create Manager (Level 3)
    manager = Agent(name="Lisa (Manager)", level=3, parent_id=director.id)
    db.session.add(manager)
    db.session.flush()  # Flush to get manager.id

    # 3. Create Team Lead (Level 2)
    team_lead = Agent(name="Bob (Team Lead)", level=2, parent_id=manager.id)
    db.session.add(team_lead)
    db.session.flush()  # Flush to get team_lead.id

    # 4. Create Agent (Level 1)
    agent = Agent(name="Sarah (Agent)", level=1, parent_id=team_lead.id)
    db.session.add(agent)
    db.session.flush()  # Flush to get agent.id

    # Commit so the data is available to the API endpoints
    db.session.commit()

    # Return the IDs for use in the test
    return {
        "agent_id": agent.id,
        "team_lead_id": team_lead.id,
        "manager_id": manager.id,
        "director_id": director.id,
    }


def test_create_sale_and_calculate_commissions(client, db, setup_hierarchy):
    """
    Test the full process of recording a sale and checking that all
    direct (FYC) and override commissions are created correctly.
    """

    # === 1. ARRANGE ===
    # Get the ID of the selling agent from our fixture
    agent_id = setup_hierarchy["agent_id"]

    # Define the sale details
    sale_data = {
        "policy_number": "POL-12345",
        "policy_value": 100000.00,  # A $100,000 policy
        "agent_id": agent_id,
    }

    # === 2. ACT ===
    # Make the API call to record the new sale
    response = client.post(
        "/api/sales", data=json.dumps(sale_data), content_type="application/json"
    )

    # === 3. ASSERT ===

    # --- Assert 3a: The API request was successful
    assert response.status_code == 201  # 201 = Created
    assert response.json["message"] == "Sale recorded successfully"
    assert response.json["sale_id"] is not None

    # --- Assert 3b: The Sale was saved correctly
    assert db.session.query(Sale).count() == 1
    new_sale = db.session.query(Sale).first()
    assert new_sale.policy_value == 100000.00
    assert new_sale.agent_id == agent_id

    # --- Assert 3c: The Hierarchy Snapshot was saved
    # (1 for the agent + 3 for the upline)
    assert db.session.query(HierarchySnapshot).count() == 4

    # --- Assert 3d: All Commissions were created (The Core Test)
    assert db.session.query(Commission).count() == 4

    # Check the FYC for the agent (50% of $100k)
    agent_comm = (
        db.session.query(Commission)
        .filter_by(agent_id=setup_hierarchy["agent_id"])
        .first()
    )
    assert agent_comm is not None
    assert agent_comm.commission_type == "FYC"
    assert agent_comm.amount == 50000.00  # 50%

    # Check the Override for the Team Lead (2% of $100k)
    tl_comm = (
        db.session.query(Commission)
        .filter_by(agent_id=setup_hierarchy["team_lead_id"])
        .first()
    )
    assert tl_comm is not None
    assert tl_comm.commission_type == "Override"
    assert tl_comm.amount == 2000.00  # 2%

    # Check the Override for the Manager (1.5% of $100k)
    mgr_comm = (
        db.session.query(Commission)
        .filter_by(agent_id=setup_hierarchy["manager_id"])
        .first()
    )
    assert mgr_comm is not None
    assert mgr_comm.commission_type == "Override"
    assert mgr_comm.amount == 1500.00  # 1.5%

    # Check the Override for the Director (1% of $100k)
    dir_comm = (
        db.session.query(Commission)
        .filter_by(agent_id=setup_hierarchy["director_id"])
        .first()
    )
    assert dir_comm is not None
    assert dir_comm.commission_type == "Override"
    assert dir_comm.amount == 1000.00  # 1%


def test_get_sales(client, db, setup_hierarchy):
    """
    Test the GET /api/sales endpoint.
    It should return a list of sales with the agent's name joined.
    """

    # --- 1. ARRANGE ---
    # Create a sale first using the POST endpoint we already tested
    sale_data = {
        "policy_number": "POL-12345",
        "policy_value": 100000.00,
        "agent_id": setup_hierarchy["agent_id"],
    }
    client.post(
        "/api/sales", data=json.dumps(sale_data), content_type="application/json"
    )

    # --- 2. ACT ---
    # Now, try to get the list of all sales
    response = client.get("/api/sales")

    # --- 3. ASSERT ---
    assert response.status_code == 200

    # Check that the data is a list
    data = response.json
    assert isinstance(data, list)
    assert len(data) == 1

    # Check the content of the sale
    sale_entry = data[0]
    assert sale_entry["policy_number"] == "POL-12345"
    assert sale_entry["policy_value"] == 100000.00
    assert sale_entry["agent_name"] == "Sarah (Agent)"
    assert sale_entry["agent_id"] == setup_hierarchy["agent_id"]
