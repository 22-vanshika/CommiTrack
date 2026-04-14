"""
Database instance and model exports.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models after db is defined to avoid circular imports
from models.agent import Agent
from models.sale import Sale
from models.commission import Commission
from models.bonus import Bonus
from models.clawback import Clawback
from models.hierarchy_snapshot import HierarchySnapshot
from models.performance_tier import PerformanceTier

__all__ = [
    "db",
    "Agent",
    "Sale",
    "Commission",
    "Bonus",
    "Clawback",
    "HierarchySnapshot",
    "PerformanceTier",
]
