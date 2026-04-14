import json
from models import Agent, db


def test_add_and_get_agents(client, db):
    """
    Test the full workflow of adding and retrieving agents
    to ensure the hierarchy is built correctly.
    """

    # === Test 1: Add a Director ===
    response = client.post(
        "/api/agents",
        data=json.dumps({"name": "Mike (Director)", "level": 4, "parent_id": None}),
        content_type="application/json",
    )

    assert response.status_code == 201  # 201 = Created
    assert response.json["name"] == "Mike (Director)"

    # Check that it's in the database
    assert db.session.query(Agent).count() == 1

    # === Test 2: Add a Manager under the Director ===
    response = client.post(
        "/api/agents",
        data=json.dumps(
            {"name": "Lisa (Manager)", "level": 3, "parent_id": 1}  # Mike's ID
        ),
        content_type="application/json",
    )

    assert response.status_code == 201
    assert db.session.query(Agent).count() == 2

    # === Test 3: Get the Hierarchy ===
    response = client.get("/api/agents")

    assert response.status_code == 200

    # Check that the returned data is correctly nested
    data = response.json
    assert len(data) == 1  # Only one top-level agent
    assert data[0]["name"] == "Mike (Director)"
    assert len(data[0]["children"]) == 1  # Mike has one child
    assert data[0]["children"][0]["name"] == "Lisa (Manager)"
