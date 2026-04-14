"""
Routes package - Flask blueprints for all API endpoints.
"""
from flask import Blueprint

from routes.agents import agents_bp
from routes.sales import sales_bp
from routes.bonuses import bonuses_bp
from routes.dashboard import dashboard_bp


def register_blueprints(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(agents_bp, url_prefix="/api")
    app.register_blueprint(sales_bp, url_prefix="/api")
    app.register_blueprint(bonuses_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")


__all__ = [
    "register_blueprints",
    "agents_bp",
    "sales_bp",
    "bonuses_bp",
    "dashboard_bp",
]
