from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from marshmallow import ValidationError

from app.extensions import db
from app.models import Job, Candidate
from app.schemas import job_schema, jobs_schema

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('', methods=['GET'])
def list_jobs():
    """List all jobs."""
    try:
        status = request.args.get('status', '').strip()
        query = Job.query
        if status:
            query = query.filter(Job.status == status)
        query = query.order_by(Job.created_at.desc())
        jobs = query.all()
        return jsonify({'jobs': [j.to_dict() for j in jobs]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('', methods=['POST'])
def create_job():
    """Create a new job."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validated = job_schema.load(data)
        except ValidationError as err:
            return jsonify({'error': 'Validation failed', 'details': err.messages}), 422

        job = Job(**validated)
        db.session.add(job)
        db.session.commit()
        return jsonify({'job': job.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a single job by ID."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'error': f'Job with ID {job_id} not found'}), 404
    return jsonify({'job': job.to_dict()}), 200


@jobs_bp.route('/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Update a job."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'error': f'Job with ID {job_id} not found'}), 404

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validated = job_schema.load(data, partial=True)
        except ValidationError as err:
            return jsonify({'error': 'Validation failed', 'details': err.messages}), 422

        for key, value in validated.items():
            setattr(job, key, value)
        job.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        return jsonify({'job': job.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job (only if no candidates are associated)."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'error': f'Job with ID {job_id} not found'}), 404

    candidate_count = job.candidates.count()
    if candidate_count > 0:
        return jsonify({
            'error': f'Cannot delete job with {candidate_count} associated candidate(s). '
                     f'Please reassign or delete candidates first.'
        }), 409

    try:
        db.session.delete(job)
        db.session.commit()
        return jsonify({'message': f'Job {job_id} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/<int:job_id>/candidates', methods=['GET'])
def get_job_candidates(job_id):
    """Get all candidates for a specific job."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'error': f'Job with ID {job_id} not found'}), 404

    candidates = Candidate.query.filter_by(job_id=job_id)\
        .order_by(Candidate.applied_at.desc()).all()
    return jsonify({
        'job': job.to_dict(include_candidate_count=False),
        'candidates': [c.to_dict() for c in candidates]
    }), 200
