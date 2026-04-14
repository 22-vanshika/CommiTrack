# backend/conftest.py
import pytest
from app import app as flask_app, seed_performance_tiers
from models import db as sqlalchemy_db, PerformanceTier


# Provide the Flask app instance
@pytest.fixture(scope="session")
def app():
    """Session-wide test `Flask` application."""
    flask_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # Use in-memory DB
        }
    )

    # Establish an application context before running tests
    with flask_app.app_context():
        sqlalchemy_db.create_all()  # Create tables
        # Seed the performance tiers once per session
        if sqlalchemy_db.session.query(PerformanceTier).count() == 0:
            try:
                # Seed performance tiers for test session
                seed_performance_tiers(flask_app)
                print("\n--- Performance tiers seeded for test session ---")
            except Exception as e:
                sqlalchemy_db.session.rollback()
                print(f"\n--- ERROR seeding tiers in test session: {e} ---")

        yield flask_app

        # Optional: Drop tables after session if needed for file DBs
        # sqlalchemy_db.drop_all()


# Provide the test client (uses the app fixture)
@pytest.fixture(scope="session")
def client(app):
    """A test client for the app."""
    return app.test_client()


# Provide the db instance - NO transactional wrapper needed for basic testing
@pytest.fixture(scope="function")
def db(app):
    """
    Provides the db instance within the app context for each test.
    Relies on in-memory DB and app context for isolation.
    """
    with app.app_context():
        # Clean tables before each test for better isolation
        # This is slightly slower but more robust than complex transaction fixtures
        sqlalchemy_db.drop_all()
        sqlalchemy_db.create_all()
        # Re-seed performance tiers for each test
        try:
            seed_performance_tiers(app)
        except Exception as e:
            sqlalchemy_db.session.rollback()
            print(f"\n--- ERROR re-seeding tiers in test: {e} ---")

        yield sqlalchemy_db  # Yield the actual db object

        # Clean up after test
        sqlalchemy_db.session.remove()
        # No need to drop_all here if we do it before the next test
