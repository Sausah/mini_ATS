import pytest


def test_dashboard_empty(client):
    """Test dashboard with empty database."""
    resp = client.get('/api/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'metrics' in data
    assert data['metrics']['total_candidates'] == 0
    assert data['metrics']['active_applications'] == 0


def test_dashboard_with_data(client, sample_candidate):
    """Test dashboard metrics with candidate data."""
    resp = client.get('/api/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['metrics']['total_candidates'] >= 1
    assert 'stage_distribution' in data
    assert 'apps_over_time' in data
    assert 'recent_activity' in data


def test_dashboard_stage_distribution(client, db, sample_job):
    """Test stage distribution accuracy."""
    from datetime import datetime, timezone
    from app.models import Candidate

    # Create candidates in known stages (unique emails per row)
    for i, stage in enumerate(['Applied', 'Applied', 'Screening', 'Interview', 'Hired']):
        c = Candidate(
            full_name=f'Test {stage} {i}',
            email=f'test_stage_{i}_{stage.lower()}@example.com',
            job_id=sample_job.id,
            stage=stage,
            applied_at=datetime.now(timezone.utc),
        )
        db.session.add(c)
    db.session.commit()

    resp = client.get('/api/dashboard')
    assert resp.status_code == 200
    data = resp.get_json()

    stage_map = {s['stage']: s['count'] for s in data['stage_distribution']}
    assert stage_map['Applied'] == 2
    assert stage_map['Screening'] == 1
    assert stage_map['Interview'] == 1
    assert stage_map['Hired'] == 1


def test_dashboard_active_applications(client, db, sample_job):
    """Test active applications metric excludes Hired and Rejected."""
    from datetime import datetime, timezone
    from app.models import Candidate

    stages = ['Applied', 'Screening', 'Hired', 'Rejected']
    for stage in stages:
        c = Candidate(
            full_name=f'Active Test {stage}',
            email=f'active_{stage.lower()}@example.com',
            job_id=sample_job.id,
            stage=stage,
            applied_at=datetime.now(timezone.utc),
        )
        db.session.add(c)
    db.session.commit()

    resp = client.get('/api/dashboard')
    data = resp.get_json()
    # Applied + Screening = 2 active
    assert data['metrics']['active_applications'] == 2


def test_pipeline_endpoint(client, sample_candidate):
    """Test pipeline groups by stage."""
    resp = client.get('/api/pipeline')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'pipeline' in data
    assert 'Applied' in data['pipeline']
    assert len(data['pipeline']['Applied']) >= 1
