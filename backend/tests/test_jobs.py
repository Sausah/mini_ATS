import pytest


def test_create_job(client):
    """Test creating a job."""
    payload = {
        'title': 'Backend Engineer',
        'department': 'Engineering',
        'location': 'Remote',
        'employment_type': 'Full-time',
        'status': 'Open',
    }
    resp = client.post('/api/jobs', json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['job']['title'] == 'Backend Engineer'
    assert data['job']['status'] == 'Open'


def test_create_job_missing_required(client):
    """Test job creation validation."""
    resp = client.post('/api/jobs', json={'title': 'Test'})
    assert resp.status_code == 422


def test_list_jobs(client, sample_job):
    """Test listing jobs."""
    resp = client.get('/api/jobs')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'jobs' in data
    assert len(data['jobs']) >= 1


def test_get_job(client, sample_job):
    """Test getting a single job."""
    resp = client.get(f'/api/jobs/{sample_job.id}')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['job']['id'] == sample_job.id


def test_get_job_not_found(client):
    """Test 404 for missing job."""
    resp = client.get('/api/jobs/99999')
    assert resp.status_code == 404


def test_update_job(client, sample_job):
    """Test updating a job."""
    payload = {'status': 'Closed', 'title': 'Senior Software Engineer'}
    resp = client.put(f'/api/jobs/{sample_job.id}', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['job']['status'] == 'Closed'


def test_delete_job_with_candidates(client, sample_job, sample_candidate):
    """Test that deleting a job with candidates fails."""
    resp = client.delete(f'/api/jobs/{sample_job.id}')
    assert resp.status_code == 409
    data = resp.get_json()
    assert 'Cannot delete' in data['error']


def test_delete_empty_job(client, db):
    """Test deleting a job with no candidates."""
    from app.models import Job
    job = Job(title='Empty Job', department='HR', location='NYC', employment_type='Full-time', status='Open')
    db.session.add(job)
    db.session.commit()

    resp = client.delete(f'/api/jobs/{job.id}')
    assert resp.status_code == 200


def test_invalid_job_status(client):
    """Test rejection of invalid job status."""
    payload = {
        'title': 'Test Job',
        'department': 'Eng',
        'location': 'Remote',
        'status': 'InvalidStatus',
    }
    resp = client.post('/api/jobs', json=payload)
    assert resp.status_code == 422
