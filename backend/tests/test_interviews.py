import pytest
from datetime import datetime, timezone, timedelta
from app.models import Candidate, Job, Interview
from app.extensions import db


@pytest.fixture
def sample_candidate(app):
    with app.app_context():
        job = Job(title='Backend Lead', department='Engineering', location='Remote')
        db.session.add(job)
        db.session.commit()

        candidate = Candidate(
            full_name='Maya Sharma',
            email='maya.sharma@example.com',
            job_id=job.id,
            stage='Applied',
        )
        db.session.add(candidate)
        db.session.commit()
        return candidate.id


def test_schedule_interview_and_auto_shortlist(client, sample_candidate):
    sched_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    res = client.post('/api/interviews', json={
        'candidate_id': sample_candidate,
        'interview_type': 'Technical Round',
        'scheduled_at': sched_time,
        'duration_minutes': 60,
        'meeting_link': 'https://meet.google.com/test-room',
        'send_email': True,
    })

    assert res.status_code == 201
    data = res.get_json()
    assert data['interview']['candidate_id'] == sample_candidate
    assert data['interview']['status'] == 'Scheduled'
    assert data['interview']['email_sent'] is True
    assert 'Interview Invitation' in data['interview']['email_subject']

    # Verify candidate was automatically advanced to 'Interview' stage
    assert data['candidate']['stage'] == 'Interview'


def test_list_interviews(client, sample_candidate):
    sched_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    client.post('/api/interviews', json={
        'candidate_id': sample_candidate,
        'scheduled_at': sched_time,
    })

    res = client.get('/api/interviews')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total'] >= 1


def test_update_interview_status(client, sample_candidate):
    sched_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    create_res = client.post('/api/interviews', json={
        'candidate_id': sample_candidate,
        'scheduled_at': sched_time,
    })
    interview_id = create_res.get_json()['interview']['id']

    # Mark as completed
    update_res = client.put(f'/api/interviews/{interview_id}', json={
        'status': 'Completed',
        'notes': 'Great communication skills demonstrated.',
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['interview']['status'] == 'Completed'


def test_resend_interview_email(client, sample_candidate):
    sched_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    create_res = client.post('/api/interviews', json={
        'candidate_id': sample_candidate,
        'scheduled_at': sched_time,
    })
    interview_id = create_res.get_json()['interview']['id']

    res = client.post(f'/api/interviews/{interview_id}/resend-email')
    assert res.status_code == 200
    assert 'email_body' in res.get_json()
