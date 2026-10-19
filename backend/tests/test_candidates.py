import pytest
import json


def test_health(client):
    """Test health endpoint returns 200."""
    resp = client.get('/api/health')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] == 'ok'


def test_create_candidate(client, sample_job):
    """Test creating a new candidate."""
    payload = {
        'full_name': 'John Doe',
        'email': 'john.doe@example.com',
        'phone': '+1-555-1234',
        'job_id': sample_job.id,
        'stage': 'Applied',
        'source': 'LinkedIn',
    }
    resp = client.post('/api/candidates', json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['candidate']['full_name'] == 'John Doe'
    assert data['candidate']['email'] == 'john.doe@example.com'
    assert data['candidate']['stage'] == 'Applied'


def test_create_candidate_missing_required_fields(client):
    """Test validation of required fields."""
    resp = client.post('/api/candidates', json={'phone': '123'})
    assert resp.status_code == 422
    data = resp.get_json()
    assert 'error' in data
    assert 'details' in data


def test_create_candidate_invalid_email(client):
    """Test email validation."""
    payload = {'full_name': 'Jane', 'email': 'not-an-email'}
    resp = client.post('/api/candidates', json=payload)
    assert resp.status_code == 422


def test_create_candidate_duplicate_email(client, sample_candidate):
    """Test duplicate email rejection."""
    payload = {
        'full_name': 'Another Person',
        'email': 'test@example.com',  # duplicate
    }
    resp = client.post('/api/candidates', json=payload)
    assert resp.status_code == 409
    data = resp.get_json()
    assert 'already exists' in data['error']


def test_list_candidates(client, sample_candidate):
    """Test listing candidates."""
    resp = client.get('/api/candidates')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'candidates' in data
    assert len(data['candidates']) >= 1
    assert 'pagination' in data


def test_get_candidate(client, sample_candidate):
    """Test getting a single candidate."""
    resp = client.get(f'/api/candidates/{sample_candidate.id}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['candidate']['id'] == sample_candidate.id
    assert data['candidate']['full_name'] == 'Test Candidate'


def test_get_candidate_not_found(client):
    """Test 404 for nonexistent candidate."""
    resp = client.get('/api/candidates/99999')
    assert resp.status_code == 404


def test_update_candidate(client, sample_candidate):
    """Test updating a candidate."""
    payload = {'full_name': 'Updated Name', 'notes': 'Updated notes'}
    resp = client.put(f'/api/candidates/{sample_candidate.id}', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['candidate']['full_name'] == 'Updated Name'


def test_delete_candidate(client, sample_candidate):
    """Test deleting a candidate."""
    cid = sample_candidate.id
    resp = client.delete(f'/api/candidates/{cid}')
    assert resp.status_code == 200

    # Verify it's gone
    resp2 = client.get(f'/api/candidates/{cid}')
    assert resp2.status_code == 404


def test_update_stage(client, sample_candidate):
    """Test stage update PATCH endpoint."""
    payload = {'stage': 'Screening', 'note': 'Phone screen scheduled'}
    resp = client.patch(f'/api/candidates/{sample_candidate.id}/stage', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['candidate']['stage'] == 'Screening'


def test_update_stage_invalid(client, sample_candidate):
    """Test rejection of invalid stage value."""
    payload = {'stage': 'InvalidStage'}
    resp = client.patch(f'/api/candidates/{sample_candidate.id}/stage', json=payload)
    assert resp.status_code == 422


def test_stage_history_recorded(client, sample_candidate):
    """Test that stage changes are recorded in history."""
    # Move to Screening
    client.patch(f'/api/candidates/{sample_candidate.id}/stage',
                 json={'stage': 'Screening', 'note': 'Screen'})

    # Get history
    resp = client.get(f'/api/candidates/{sample_candidate.id}/history')
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['history']) >= 1
    stages = [h['new_stage'] for h in data['history']]
    assert 'Screening' in stages


def test_search_candidates(client, sample_candidate):
    """Test search by name."""
    resp = client.get('/api/candidates?search=Test')
    assert resp.status_code == 200
    data = resp.get_json()
    assert any(c['full_name'] == 'Test Candidate' for c in data['candidates'])


def test_filter_by_stage(client, sample_candidate):
    """Test filtering by stage."""
    resp = client.get('/api/candidates?stage=Applied')
    assert resp.status_code == 200
    data = resp.get_json()
    assert all(c['stage'] == 'Applied' for c in data['candidates'])


def test_pagination(client, db, sample_job):
    """Test pagination works."""
    from datetime import datetime, timezone
    from app.models import Candidate

    # Create 5 more candidates
    for i in range(5):
        c = Candidate(
            full_name=f'Candidate {i}',
            email=f'candidate{i}@example.com',
            job_id=sample_job.id,
            stage='Applied',
            applied_at=datetime.now(timezone.utc),
        )
        db.session.add(c)
    db.session.commit()

    resp = client.get('/api/candidates?page=1&limit=3')
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['candidates']) <= 3
    assert data['pagination']['limit'] == 3
    assert data['pagination']['total'] >= 5


def test_create_candidate_invalid_job(client):
    """Test that invalid job_id returns 404."""
    payload = {
        'full_name': 'Test Person',
        'email': 'testperson@example.com',
        'job_id': 99999,
    }
    resp = client.post('/api/candidates', json=payload)
    assert resp.status_code == 404
