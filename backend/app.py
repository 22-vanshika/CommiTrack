"""
Commission Calculation System - Flask Application Entry Point

This is the main entry point for the application.
Models, routes, and services are organized in their respective packages.
"""
from flask import Flask
from flask_cors import CORS
from sqlalchemy import func, select
import os

# Import database and models
from models import (
    db,
    Agent,
    Sale,
    Commission,
    Bonus,
    Clawback,
    HierarchySnapshot,
    PerformanceTier,
)

# Import route registration
from routes import register_blueprints


def create_app():
    """Application factory function."""
    app = Flask(__name__)

    # CORS configuration - allow frontend domain
    allowed_origins = [
        "http://localhost:3000",  # Local development
        "https://commission-calculation-system-beta.vercel.app",  # Vercel deployment
    ]

    # If FRONTEND_URL is set in environment, use it
    if os.getenv("FRONTEND_URL"):
        allowed_origins.append(os.getenv("FRONTEND_URL"))

    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Database configuration - SQLite for both development and production
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///commission.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize database with app
    db.init_app(app)

    # Register all route blueprints
    register_blueprints(app)

    return app


def seed_performance_tiers(app):
    """Adds the default performance tier data to the database."""
    with app.app_context():
        stmt = select(func.count(PerformanceTier.id))
        count = db.session.scalar(stmt)

        if count > 0:
            print("Performance tiers already seeded.")
            return

        print("Seeding performance tiers...")
        tiers_data = [
            {"agent_level": 1, "tier_name": "BRONZE", "min_volume": 0, "max_volume": 25000, "bonus_rate": 0.00},
            {"agent_level": 1, "tier_name": "SILVER", "min_volume": 25000, "max_volume": 50000, "bonus_rate": 0.02},
            {"agent_level": 1, "tier_name": "GOLD", "min_volume": 50000, "max_volume": 100000, "bonus_rate": 0.03},
            {"agent_level": 1, "tier_name": "PLATINUM", "min_volume": 100000, "max_volume": float("inf"), "bonus_rate": 0.05},
            {"agent_level": 2, "tier_name": "BRONZE", "min_volume": 0, "max_volume": 100000, "bonus_rate": 0.00},
            {"agent_level": 2, "tier_name": "SILVER", "min_volume": 100000, "max_volume": 250000, "bonus_rate": 0.03},
            {"agent_level": 2, "tier_name": "GOLD", "min_volume": 250000, "max_volume": 500000, "bonus_rate": 0.05},
            {"agent_level": 2, "tier_name": "PLATINUM", "min_volume": 500000, "max_volume": float("inf"), "bonus_rate": 0.07},
            {"agent_level": 3, "tier_name": "BRONZE", "min_volume": 0, "max_volume": 500000, "bonus_rate": 0.00},
            {"agent_level": 3, "tier_name": "SILVER", "min_volume": 500000, "max_volume": 1000000, "bonus_rate": 0.04},
            {"agent_level": 3, "tier_name": "GOLD", "min_volume": 1000000, "max_volume": 2000000, "bonus_rate": 0.06},
            {"agent_level": 3, "tier_name": "PLATINUM", "min_volume": 2000000, "max_volume": float("inf"), "bonus_rate": 0.08},
            {"agent_level": 4, "tier_name": "BRONZE", "min_volume": 0, "max_volume": 1000000, "bonus_rate": 0.00},
            {"agent_level": 4, "tier_name": "SILVER", "min_volume": 1000000, "max_volume": 3000000, "bonus_rate": 0.05},
            {"agent_level": 4, "tier_name": "GOLD", "min_volume": 3000000, "max_volume": 5000000, "bonus_rate": 0.07},
            {"agent_level": 4, "tier_name": "PLATINUM", "min_volume": 5000000, "max_volume": float("inf"), "bonus_rate": 0.10},
        ]

        for tier_info in tiers_data:
            tier = PerformanceTier(**tier_info)
            db.session.add(tier)

        db.session.flush()
        db.session.commit()
        print("Performance tiers seeded successfully!")


# Create app instance
app = create_app()

# Initialize database when module is loaded (works with Gunicorn)
with app.app_context():
    db.create_all()
    print("✅ Database tables created!")

seed_performance_tiers(app)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
