"""
Commission calculation services - upline traversal and commission rates.
"""
from sqlalchemy import select
from models import Agent


COMMISSION_RATES = {
    "FYC": 0.50,
    "Override": {
        2: 0.02,
        3: 0.015,
        4: 0.01,
    },
}


def get_upline(agent_id, db_session):
    """
    Finds all managers in the agent's upline.
    Returns a list of Agent objects.
    """
    upline = []
    current_agent = db_session.get(Agent, agent_id)

    while current_agent and current_agent.parent_id:
        parent = db_session.get(Agent, current_agent.parent_id)
        if parent:
            upline.append(parent)
            current_agent = parent
        else:
            break
    return upline


def get_downline_agent_ids(agent_id, db_session):
    """Recursively finds all agent IDs in the downline, including the starting agent."""
    agent_ids = {agent_id}

    children_stmt = select(Agent.id).where(Agent.parent_id == agent_id)
    children_ids = db_session.scalars(children_stmt).all()

    for child_id in children_ids:
        agent_ids.update(get_downline_agent_ids(child_id, db_session))

    return list(agent_ids)
