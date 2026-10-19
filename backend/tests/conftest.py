import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db as _db
from app.models import Job, Candidate, StageHistory


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope='function')
def db(app):
    """Provide clean DB per test."""
    with app.app_context():
        yield _db
        _db.session.remove()
        # Clear tables
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture(scope='function')
def client(app, db):
    """Test client."""
    return app.test_client()


@pytest.fixture
def sample_job(db):
    """Create a sample job."""
    job = Job(
        title='Software Engineer',
        department='Engineering',
        location='Remote',
        employment_type='Full-time',
        status='Open',
    )
    db.session.add(job)
    db.session.commit()
    return job


@pytest.fixture
def sample_candidate(db, sample_job):
    """Create a sample candidate."""
    from datetime import datetime, timezone
    candidate = Candidate(
        full_name='Test Candidate',
        email='test@example.com',
        phone='+1-555-0000',
        job_id=sample_job.id,
        stage='Applied',
        source='LinkedIn',
        notes='Test notes',
        applied_at=datetime.now(timezone.utc),
    )
    db.session.add(candidate)
    db.session.commit()
    return candidate
