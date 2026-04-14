"""
Agent routes - CRUD operations for agent hierarchy.
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func, select
from models import db, Agent, Sale
from services import get_downline_agent_ids

agents_bp = Blueprint("agents", __name__)


@agents_bp.route("/agents", methods=["POST"])
def add_agent():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        if not data.get("name") or not isinstance(data.get("name"), str):
            return (
                jsonify({"error": "Agent name is required and must be a string"}),
                400,
            )

        if not data.get("level") or not isinstance(data.get("level"), int):
            return (
                jsonify({"error": "Agent level is required and must be an integer"}),
                400,
            )

        if data.get("level") not in [1, 2, 3, 4]:
            return (
                jsonify(
                    {
                        "error": "Agent level must be 1 (Agent), 2 (Team Lead), 3 (Manager), or 4 (Director)"
                    }
                ),
                400,
            )

        parent_id = data.get("parent_id")
        if parent_id is not None:
            parent_agent = db.session.get(Agent, parent_id)
            if not parent_agent:
                return (
                    jsonify({"error": f"Parent agent with ID {parent_id} not found"}),
                    404,
                )

            if parent_agent.level <= data.get("level"):
                return (
                    jsonify(
                        {
                            "error": "Parent agent must be at a higher level than the child agent"
                        }
                    ),
                    400,
                )

        new_agent = Agent(
            name=data["name"].strip(), level=data["level"], parent_id=parent_id
        )
        db.session.add(new_agent)
        db.session.commit()
        return jsonify(new_agent.to_dict()), 201

    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding agent: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while adding the agent"}),
            500,
        )


@agents_bp.route("/agents", methods=["GET"])
def get_agents():
    try:
        level_filter = request.args.get("level", type=int)

        if level_filter:
            if level_filter not in [1, 2, 3, 4]:
                return jsonify({"error": "Level filter must be 1, 2, 3, or 4"}), 400

            stmt = select(Agent).filter_by(level=level_filter)
            agents = db.session.scalars(stmt).all()
            return jsonify([agent.to_dict() for agent in agents])

        stmt = select(Agent).filter_by(parent_id=None)
        top_level_agents = db.session.scalars(stmt).all()
        hierarchy = [agent.to_dict(include_children=True) for agent in top_level_agents]
        return jsonify(hierarchy)
    except Exception as e:
        current_app.logger.error(f"Error fetching agents: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while fetching agents"}),
            500,
        )


@agents_bp.route("/agents/<int:agent_id>", methods=["PUT"])
def update_agent(agent_id):
    """Updates an existing agent's details."""
    try:
        agent = db.session.get(Agent, agent_id)
        if not agent:
            return jsonify({"error": "Agent not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        if "name" in data:
            if not isinstance(data["name"], str) or not data["name"].strip():
                return jsonify({"error": "Agent name must be a non-empty string"}), 400
            agent.name = data["name"].strip()

        if "level" in data:
            if not isinstance(data["level"], int) or data["level"] not in [1, 2, 3, 4]:
                return jsonify({"error": "Agent level must be 1, 2, 3, or 4"}), 400

            if agent.parent_id:
                parent = db.session.get(Agent, agent.parent_id)
                if parent and parent.level <= data["level"]:
                    return (
                        jsonify(
                            {
                                "error": "Cannot update level: parent must be at a higher level"
                            }
                        ),
                        400,
                    )

            for child in agent.children:
                if child.level >= data["level"]:
                    return (
                        jsonify(
                            {
                                "error": f"Cannot update level: child agent {child.name} (Level {child.level}) must be at a lower level"
                            }
                        ),
                        400,
                    )

            agent.level = data["level"]

        if "parent_id" in data:
            parent_id = data["parent_id"]

            if parent_id is not None:
                if not isinstance(parent_id, int):
                    return (
                        jsonify({"error": "Parent ID must be an integer or null"}),
                        400,
                    )

                parent_agent = db.session.get(Agent, parent_id)
                if not parent_agent:
                    return (
                        jsonify(
                            {"error": f"Parent agent with ID {parent_id} not found"}
                        ),
                        404,
                    )

                if parent_id == agent_id:
                    return jsonify({"error": "Agent cannot be its own parent"}), 400

                descendant_ids = get_downline_agent_ids(agent_id, db.session)
                if parent_id in descendant_ids:
                    return (
                        jsonify(
                            {
                                "error": "Cannot create circular reference: parent cannot be a descendant"
                            }
                        ),
                        400,
                    )

                if parent_agent.level <= agent.level:
                    return (
                        jsonify(
                            {
                                "error": "Parent agent must be at a higher level than the child agent"
                            }
                        ),
                        400,
                    )

            agent.parent_id = parent_id

        db.session.commit()
        return jsonify(agent.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating agent: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while updating the agent"}),
            500,
        )


@agents_bp.route("/agents/<int:agent_id>", methods=["DELETE"])
def delete_agent(agent_id):
    """Deletes an agent. Prevents deletion if agent has sales or children."""
    try:
        agent = db.session.get(Agent, agent_id)
        if not agent:
            return jsonify({"error": "Agent not found"}), 404

        sales_count = db.session.scalar(
            select(func.count(Sale.id)).where(Sale.agent_id == agent_id)
        )
        if sales_count > 0:
            return (
                jsonify(
                    {
                        "error": f"Cannot delete agent: agent has {sales_count} associated sales"
                    }
                ),
                400,
            )

        children_count = db.session.scalar(
            select(func.count(Agent.id)).where(Agent.parent_id == agent_id)
        )
        if children_count > 0:
            return (
                jsonify(
                    {
                        "error": f"Cannot delete agent: agent has {children_count} child agents. Remove or reassign children first."
                    }
                ),
                400,
            )

        db.session.delete(agent)
        db.session.commit()
        return jsonify({"message": "Agent deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting agent: {e}", exc_info=True)
        return (
            jsonify({"error": "An internal error occurred while deleting the agent"}),
            500,
        )
