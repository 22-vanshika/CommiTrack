import pytest
import json
from models import db, Agent, Sale


def test_add_agent_empty_request_body(client, db):
    """Test POST /api/agents with empty request body."""
    response = client.post("/api/agents", json={})
    assert response.status_code == 400
    assert b"Request body is required" in response.data


def test_add_agent_missing_name(client, db):
    """Test POST /api/agents with missing name."""
    response = client.post("/api/agents", json={"level": 1})
    assert response.status_code == 400
    assert b"Agent name is required" in response.data


def test_add_agent_invalid_name_type(client, db):
    """Test POST /api/agents with invalid name type."""
    response = client.post("/api/agents", json={"name": 123, "level": 1})
    assert response.status_code == 400
    assert b"Agent name is required and must be a string" in response.data


def test_add_agent_missing_level(client, db):
    """Test POST /api/agents with missing level."""
    response = client.post("/api/agents", json={"name": "Test Agent"})
    assert response.status_code == 400
    assert b"Agent level is required" in response.data


def test_add_agent_invalid_level_type(client, db):
    """Test POST /api/agents with invalid level type."""
    response = client.post("/api/agents", json={"name": "Test Agent", "level": "one"})
    assert response.status_code == 400
    assert b"Agent level is required and must be an integer" in response.data


def test_add_agent_invalid_level_value(client, db):
    """Test POST /api/agents with invalid level value (not 1-4)."""
    response = client.post("/api/agents", json={"name": "Test Agent", "level": 5})
    assert response.status_code == 400
    assert b"Agent level must be 1" in response.data


def test_add_agent_nonexistent_parent(client, db):
    """Test POST /api/agents with non-existent parent_id."""
    response = client.post(
        "/api/agents", json={"name": "Test Agent", "level": 1, "parent_id": 9999}
    )
    assert response.status_code == 404
    assert b"Parent agent with ID 9999 not found" in response.data


def test_add_agent_invalid_hierarchy(client, db):
    """Test POST /api/agents with invalid hierarchy (parent level <= child level)."""
    # Create a Level 1 agent
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    assert agent_resp.status_code == 201
    agent_id = agent_resp.json["id"]

    # Try to add a Level 2 agent as child of Level 1 agent (should fail)
    response = client.post(
        "/api/agents", json={"name": "Team Lead", "level": 2, "parent_id": agent_id}
    )
    assert response.status_code == 400
    assert b"Parent agent must be at a higher level" in response.data


def test_get_agents_invalid_level_filter(client, db):
    """Test GET /api/agents with invalid level filter."""
    response = client.get("/api/agents?level=5")
    assert response.status_code == 400
    assert b"Level filter must be 1, 2, 3, or 4" in response.data


def test_create_sale_empty_request_body(client, db):
    """Test POST /api/sales with empty request body."""
    response = client.post("/api/sales", json={})
    assert response.status_code == 400
    assert b"Request body is required" in response.data


def test_create_sale_missing_policy_number(client, db):
    """Test POST /api/sales with missing policy_number."""
    # Create an agent first
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales", json={"policy_value": 100000, "agent_id": agent_id}
    )
    assert response.status_code == 400
    assert b"Policy number is required" in response.data


def test_create_sale_invalid_policy_number_type(client, db):
    """Test POST /api/sales with invalid policy_number type."""
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales",
        json={"policy_number": 12345, "policy_value": 100000, "agent_id": agent_id},
    )
    assert response.status_code == 400
    assert b"Policy number is required and must be a string" in response.data


def test_create_sale_missing_policy_value(client, db):
    """Test POST /api/sales with missing policy_value."""
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales", json={"policy_number": "POL-001", "agent_id": agent_id}
    )
    assert response.status_code == 400
    assert b"Policy value is required" in response.data


def test_create_sale_invalid_policy_value_type(client, db):
    """Test POST /api/sales with invalid policy_value type."""
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales",
        json={
            "policy_number": "POL-001",
            "policy_value": "hundred",
            "agent_id": agent_id,
        },
    )
    assert response.status_code == 400
    assert b"Policy value is required and must be a number" in response.data


def test_create_sale_zero_policy_value(client, db):
    """Test POST /api/sales with zero policy_value."""
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales",
        json={"policy_number": "POL-001", "policy_value": 0, "agent_id": agent_id},
    )
    assert response.status_code == 400
    assert b"Policy value must be greater than zero" in response.data


def test_create_sale_negative_policy_value(client, db):
    """Test POST /api/sales with negative policy_value."""
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    response = client.post(
        "/api/sales",
        json={"policy_number": "POL-001", "policy_value": -1000, "agent_id": agent_id},
    )
    assert response.status_code == 400
    assert b"Policy value must be greater than zero" in response.data


def test_create_sale_missing_agent_id(client, db):
    """Test POST /api/sales with missing agent_id."""
    response = client.post(
        "/api/sales", json={"policy_number": "POL-001", "policy_value": 100000}
    )
    assert response.status_code == 400
    assert b"Agent ID is required" in response.data


def test_create_sale_invalid_agent_id_type(client, db):
    """Test POST /api/sales with invalid agent_id type."""
    response = client.post(
        "/api/sales",
        json={"policy_number": "POL-001", "policy_value": 100000, "agent_id": "one"},
    )
    assert response.status_code == 400
    assert b"Agent ID is required and must be an integer" in response.data


def test_create_sale_nonexistent_agent(client, db):
    """Test POST /api/sales with non-existent agent_id."""
    response = client.post(
        "/api/sales",
        json={"policy_number": "POL-001", "policy_value": 100000, "agent_id": 9999},
    )
    assert response.status_code == 404
    assert b"Agent with ID 9999 not found" in response.data


def test_create_sale_duplicate_policy_number(client, db):
    """Test POST /api/sales with duplicate policy_number."""
    # Create an agent
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]

    # Create first sale
    first_sale = client.post(
        "/api/sales",
        json={"policy_number": "POL-DUP", "policy_value": 100000, "agent_id": agent_id},
    )
    assert first_sale.status_code == 201

    # Try to create duplicate
    response = client.post(
        "/api/sales",
        json={"policy_number": "POL-DUP", "policy_value": 50000, "agent_id": agent_id},
    )
    assert response.status_code == 409
    assert b"Policy number POL-DUP already exists" in response.data


def test_cancel_sale_nonexistent(client, db):
    """Test PUT /api/sales/<id>/cancel with non-existent sale_id."""
    response = client.put("/api/sales/9999/cancel")
    assert response.status_code == 404
    assert b"Sale not found" in response.data


def test_cancel_sale_already_cancelled(client, db):
    """Test PUT /api/sales/<id>/cancel on already cancelled sale (idempotency)."""
    # Create agent and sale
    agent_resp = client.post("/api/agents", json={"name": "Agent", "level": 1})
    agent_id = agent_resp.json["id"]
    sale_resp = client.post(
        "/api/sales",
        json={
            "policy_number": "POL-CANCEL",
            "policy_value": 100000,
            "agent_id": agent_id,
        },
    )
    sale_id = sale_resp.json["sale_id"]

    # Cancel first time
    first_cancel = client.put(f"/api/sales/{sale_id}/cancel")
    assert first_cancel.status_code == 200

    # Cancel second time (should be idempotent)
    second_cancel = client.put(f"/api/sales/{sale_id}/cancel")
    assert second_cancel.status_code == 200
    assert b"already marked as cancelled" in second_cancel.data


def test_calculate_bonuses_invalid_type(client, db):
    """Test POST /api/bonuses/calculate with invalid bonus type."""
    response = client.post(
        "/api/bonuses/calculate", json={"period": "2024-10", "type": "Weekly"}
    )
    assert response.status_code == 400
    assert b"Invalid bonus type" in response.data


def test_calculate_bonuses_missing_period(client, db):
    """Test POST /api/bonuses/calculate with missing period."""
    response = client.post("/api/bonuses/calculate", json={"type": "Monthly"})
    assert response.status_code == 400
    assert b"Period string is required" in response.data


def test_calculate_bonuses_invalid_monthly_format(client, db):
    """Test POST /api/bonuses/calculate with invalid monthly period format."""
    response = client.post(
        "/api/bonuses/calculate", json={"period": "2024", "type": "Monthly"}
    )
    assert response.status_code == 400
    assert b"Invalid period format" in response.data


def test_calculate_bonuses_invalid_month_value(client, db):
    """Test POST /api/bonuses/calculate with invalid month value (13)."""
    response = client.post(
        "/api/bonuses/calculate", json={"period": "2024-13", "type": "Monthly"}
    )
    assert response.status_code == 400
    assert b"Invalid period format" in response.data


def test_calculate_bonuses_invalid_quarterly_format(client, db):
    """Test POST /api/bonuses/calculate with invalid quarterly period format."""
    response = client.post(
        "/api/bonuses/calculate", json={"period": "2024-Q", "type": "Quarterly"}
    )
    assert response.status_code == 400
    assert b"Invalid period format" in response.data


def test_calculate_bonuses_invalid_quarter_value(client, db):
    """Test POST /api/bonuses/calculate with invalid quarter value (Q5)."""
    response = client.post(
        "/api/bonuses/calculate", json={"period": "2024-Q5", "type": "Quarterly"}
    )
    assert response.status_code == 400
    assert b"Invalid period format" in response.data


def test_calculate_bonuses_invalid_annual_format(client, db):
    """Test POST /api/bonuses/calculate with invalid annual period format."""
    response = client.post(
        "/api/bonuses/calculate",
        json={"period": "twenty-twenty-four", "type": "Annual"},
    )
    assert response.status_code == 400
    assert b"Invalid period format" in response.data
