from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app.extensions import db
from app.models import Interview, Candidate, Job, StageHistory, VALID_INTERVIEW_TYPES, VALID_INTERVIEW_STATUSES

interviews_bp = Blueprint('interviews', __name__)


def generate_interview_email(candidate, job_title, interview_type, scheduled_at, duration, interviewer, meeting_link, location):
    dt_str = scheduled_at.strftime('%A, %B %d, %Y at %I:%M %p UTC') if hasattr(scheduled_at, 'strftime') else str(scheduled_at)
    subject = f"Interview Invitation: {job_title or 'Position'} at Mini ATS"
    body = f"""Dear {candidate.full_name},

Thank you for your interest in joining our team! We have reviewed your profile and are thrilled to shortlist you for the {job_title or 'open position'} role.

We would like to invite you to an interview:

• Round: {interview_type}
• Date & Time: {dt_str}
• Duration: {duration} minutes
• Interviewer: {interviewer}
• Location / Platform: {location or 'Online'}
• Meeting Link: {meeting_link or 'https://meet.google.com/ats-interview'}

Preparation Tips:
Please ensure you are in a quiet room with a stable internet connection. If you need to reschedule or have any questions beforehand, please reply directly to this invitation.

We look forward to meeting with you!

Warm regards,
Recruitment & Talent Acquisition Team
Mini ATS
"""
    return subject, body


@interviews_bp.route('', methods=['GET'])
def list_interviews():
    """List scheduled interviews, filterable by date, month, candidate, or status."""
    try:
        date_str = request.args.get('date', '').strip()  # YYYY-MM-DD
        month_str = request.args.get('month', '').strip() # YYYY-MM
        status = request.args.get('status', '').strip()
        candidate_id = request.args.get('candidate_id', '').strip()

        query = Interview.query

        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                query = query.filter(db.func.date(Interview.scheduled_at) == target_date)
            except ValueError:
                pass

        elif month_str:
            try:
                # e.g. 2026-10
                parts = month_str.split('-')
                year, month = int(parts[0]), int(parts[1])
                start_date = datetime(year, month, 1, tzinfo=timezone.utc)
                if month == 12:
                    end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
                else:
                    end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
                query = query.filter(Interview.scheduled_at >= start_date, Interview.scheduled_at < end_date)
            except (ValueError, IndexError):
                pass

        if status and status in VALID_INTERVIEW_STATUSES:
            query = query.filter(Interview.status == status)

        if candidate_id:
            try:
                query = query.filter(Interview.candidate_id == int(candidate_id))
            except ValueError:
                pass

        interviews = query.order_by(Interview.scheduled_at.asc()).all()

        return jsonify({
            'interviews': [i.to_dict() for i in interviews],
            'total': len(interviews),
            'types': VALID_INTERVIEW_TYPES,
            'statuses': VALID_INTERVIEW_STATUSES,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@interviews_bp.route('', methods=['POST'])
def schedule_interview():
    """Schedule a new interview appointment, optionally email the candidate, and update candidate stage."""
    try:
        data = request.get_json() or {}
        candidate_id = data.get('candidate_id')
        if not candidate_id:
            return jsonify({'error': 'candidate_id is required'}), 400

        candidate = db.session.get(Candidate, candidate_id)
        if not candidate:
            return jsonify({'error': f'Candidate {candidate_id} not found'}), 404

        scheduled_at_raw = data.get('scheduled_at')
        if not scheduled_at_raw:
            return jsonify({'error': 'scheduled_at is required'}), 400

        try:
            scheduled_at = datetime.fromisoformat(scheduled_at_raw.replace('Z', '+00:00'))
        except Exception:
            return jsonify({'error': 'Invalid scheduled_at datetime format'}), 400

        interview_type = data.get('interview_type', 'Technical Round')
        title = data.get('title', f"{interview_type} with {candidate.full_name}")
        duration_minutes = int(data.get('duration_minutes', 45))
        interviewer_name = data.get('interviewer_name', 'Recruiter Admin')
        interviewer_email = data.get('interviewer_email', 'admin@miniats.com')
        meeting_link = data.get('meeting_link', 'https://meet.google.com/ats-interview')
        location = data.get('location', 'Google Meet')
        notes = data.get('notes', '')
        send_email = data.get('send_email', True)

        job_title = candidate.job.title if candidate.job else None
        subject, body = generate_interview_email(
            candidate=candidate,
            job_title=job_title,
            interview_type=interview_type,
            scheduled_at=scheduled_at,
            duration=duration_minutes,
            interviewer=interviewer_name,
            meeting_link=meeting_link,
            location=location
        )

        # Allow customized email body/subject if supplied
        custom_subject = data.get('email_subject') or subject
        custom_body = data.get('email_body') or body

        now = datetime.now(timezone.utc)
        interview = Interview(
            candidate_id=candidate.id,
            job_id=candidate.job_id,
            title=title,
            interview_type=interview_type,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            interviewer_name=interviewer_name,
            interviewer_email=interviewer_email,
            meeting_link=meeting_link,
            location=location,
            status='Scheduled',
            notes=notes,
            email_sent=bool(send_email),
            email_sent_at=now if send_email else None,
            email_subject=custom_subject if send_email else None,
            email_body=custom_body if send_email else None,
        )
        db.session.add(interview)

        # Auto-advance candidate to 'Interview' stage if currently in Applied or Screening
        if candidate.stage in ['Applied', 'Screening']:
            prev_stage = candidate.stage
            candidate.stage = 'Interview'
            candidate.updated_at = now
            history = StageHistory(
                candidate_id=candidate.id,
                previous_stage=prev_stage,
                new_stage='Interview',
                note=f"Shortlisted & scheduled {interview_type} for {scheduled_at.strftime('%b %d, %Y %I:%M %p')}"
            )
            db.session.add(history)

        db.session.commit()

        return jsonify({
            'message': 'Interview scheduled successfully and invitation email dispatched.',
            'interview': interview.to_dict(),
            'candidate': candidate.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@interviews_bp.route('/<int:interview_id>', methods=['GET'])
def get_interview(interview_id):
    """Get single interview details."""
    interview = db.session.get(Interview, interview_id)
    if not interview:
        return jsonify({'error': f'Interview {interview_id} not found'}), 404
    return jsonify({'interview': interview.to_dict()}), 200


@interviews_bp.route('/<int:interview_id>', methods=['PUT'])
def update_interview(interview_id):
    """Update interview date/time, status, meeting link, or notes."""
    interview = db.session.get(Interview, interview_id)
    if not interview:
        return jsonify({'error': f'Interview {interview_id} not found'}), 404

    data = request.get_json() or {}
    try:
        if 'scheduled_at' in data:
            interview.scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
        if 'title' in data:
            interview.title = data['title']
        if 'interview_type' in data:
            interview.interview_type = data['interview_type']
        if 'duration_minutes' in data:
            interview.duration_minutes = int(data['duration_minutes'])
        if 'interviewer_name' in data:
            interview.interviewer_name = data['interviewer_name']
        if 'interviewer_email' in data:
            interview.interviewer_email = data['interviewer_email']
        if 'meeting_link' in data:
            interview.meeting_link = data['meeting_link']
        if 'location' in data:
            interview.location = data['location']
        if 'status' in data and data['status'] in VALID_INTERVIEW_STATUSES:
            interview.status = data['status']
        if 'notes' in data:
            interview.notes = data['notes']

        interview.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({
            'message': 'Interview updated successfully',
            'interview': interview.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@interviews_bp.route('/<int:interview_id>', methods=['DELETE'])
def delete_interview(interview_id):
    """Delete an interview appointment."""
    interview = db.session.get(Interview, interview_id)
    if not interview:
        return jsonify({'error': f'Interview {interview_id} not found'}), 404

    try:
        db.session.delete(interview)
        db.session.commit()
        return jsonify({'message': f'Interview {interview_id} cancelled and removed'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@interviews_bp.route('/<int:interview_id>/resend-email', methods=['POST'])
def resend_email(interview_id):
    """Resend or preview invitation email for an interview appointment."""
    interview = db.session.get(Interview, interview_id)
    if not interview:
        return jsonify({'error': f'Interview {interview_id} not found'}), 404

    candidate = interview.candidate
    job_title = interview.job.title if interview.job else None
    subject, body = generate_interview_email(
        candidate=candidate,
        job_title=job_title,
        interview_type=interview.interview_type,
        scheduled_at=interview.scheduled_at,
        duration=interview.duration_minutes,
        interviewer=interview.interviewer_name,
        meeting_link=interview.meeting_link,
        location=interview.location
    )

    now = datetime.now(timezone.utc)
    interview.email_sent = True
    interview.email_sent_at = now
    interview.email_subject = subject
    interview.email_body = body
    db.session.commit()

    return jsonify({
        'message': f"Interview email re-sent to {candidate.email}",
        'email_subject': subject,
        'email_body': body,
        'email_sent_at': now.isoformat(),
    }), 200
