"""
Bonus model - volume-based bonus calculations.
"""
from datetime import datetime, timezone
from models import db


class Bonus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    bonus_type = db.Column(db.String(50))
    period = db.Column(db.String(50))
    agent_id = db.Column(db.Integer, db.ForeignKey("agent.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
