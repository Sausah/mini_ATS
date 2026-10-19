from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc, asc
from datetime import datetime, timezone
from marshmallow import ValidationError

from app.extensions import db
from app.models import Candidate, Job, StageHistory, VALID_STAGES
from app.schemas import candidate_schema, candidates_schema, stage_update_schema

candidates_bp = Blueprint('candidates', __name__)

ALLOWED_SORT_FIELDS = {
    'applied_at': Candidate.applied_at,
    'full_name': Candidate.full_name,
    'created_at': Candidate.created_at,
}


def _paginate_query(query, page, limit):
    """Returns paginated results with metadata."""
    page = max(1, int(page))
    limit = min(100, max(1, int(limit)))
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return items, {
        'page': page,
        'limit': limit,
        'total': total,
        'pages': (total + limit - 1) // limit if total > 0 else 1,
        'has_next': (page * limit) < total,
        'has_prev': page > 1,
    }


@candidates_bp.route('', methods=['GET'])
def list_candidates():
    """List candidates with search, filter, sort, and pagination."""
    try:
        search = request.args.get('search', '').strip()
        stage = request.args.get('stage', '').strip()
        job_id = request.args.get('job_id', '').strip()
        source = request.args.get('source', '').strip()
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()
        sort_by = request.args.get('sort_by', 'applied_at').strip()
        sort_order = request.args.get('sort_order', 'desc').strip()
        page = request.args.get('page', 1)
        limit = request.args.get('limit', 10)

        query = Candidate.query.join(Candidate.job, isouter=True)

        # Search by name or email
        if search:
            query = query.filter(
                or_(
                    Candidate.full_name.ilike(f'%{search}%'),
                    Candidate.email.ilike(f'%{search}%')
                )
            )

        # Filter by stage
        if stage and stage in VALID_STAGES:
            query = query.filter(Candidate.stage == stage)

        # Filter by job
        if job_id:
            try:
                query = query.filter(Candidate.job_id == int(job_id))
            except ValueError:
                pass

        # Filter by source
        if source:
            query = query.filter(Candidate.source == source)

        # Filter by date range
        if date_from:
            try:
                df = datetime.fromisoformat(date_from)
                query = query.filter(Candidate.applied_at >= df)
            except ValueError:
                pass
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to)
                query = query.filter(Candidate.applied_at <= dt)
            except ValueError:
                pass

        # Sorting
        sort_col = ALLOWED_SORT_FIELDS.get(sort_by, Candidate.applied_at)
        if sort_order == 'asc':
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        try:
            page = int(page)
            limit = int(limit)
        except (ValueError, TypeError):
            page, limit = 1, 10

        items, pagination = _paginate_query(query, page, limit)

        return jsonify({
            'candidates': [c.to_dict() for c in items],
            'pagination': pagination
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('', methods=['POST'])
def create_candidate():
    """Create a new candidate."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validated = candidate_schema.load(data)
        except ValidationError as err:
            return jsonify({'error': 'Validation failed', 'details': err.messages}), 422

        # Check duplicate email
        existing = Candidate.query.filter_by(email=validated['email']).first()
        if existing:
            return jsonify({'error': 'A candidate with this email already exists'}), 409

        # Validate job exists if provided
        job_id = validated.get('job_id')
        if job_id:
            job = db.session.get(Job, job_id)
            if not job:
                return jsonify({'error': f'Job with ID {job_id} not found'}), 404

        # Set applied_at if not provided
        if not validated.get('applied_at'):
            validated['applied_at'] = datetime.now(timezone.utc)

        candidate = Candidate(**validated)
        db.session.add(candidate)
        db.session.flush()  # Get ID before commit

        # Create initial stage history
        history = StageHistory(
            candidate_id=candidate.id,
            previous_stage=None,
            new_stage=candidate.stage,
            note='Application received'
        )
        db.session.add(history)
        db.session.commit()

        return jsonify({'candidate': candidate.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/<int:candidate_id>', methods=['GET'])
def get_candidate(candidate_id):
    """Get a single candidate by ID."""
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'error': f'Candidate with ID {candidate_id} not found'}), 404
    return jsonify({'candidate': candidate.to_dict(include_history=True)}), 200


@candidates_bp.route('/<int:candidate_id>', methods=['PUT'])
def update_candidate(candidate_id):
    """Update a candidate."""
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'error': f'Candidate with ID {candidate_id} not found'}), 404

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validated = candidate_schema.load(data, partial=True)
        except ValidationError as err:
            return jsonify({'error': 'Validation failed', 'details': err.messages}), 422

        # Check email uniqueness if email is being changed
        new_email = validated.get('email')
        if new_email and new_email != candidate.email:
            existing = Candidate.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'A candidate with this email already exists'}), 409

        # Validate job if changed
        new_job_id = validated.get('job_id')
        if new_job_id and new_job_id != candidate.job_id:
            job = db.session.get(Job, new_job_id)
            if not job:
                return jsonify({'error': f'Job with ID {new_job_id} not found'}), 404

        # Handle stage change
        old_stage = candidate.stage
        new_stage = validated.get('stage')
        if new_stage and new_stage != old_stage:
            history = StageHistory(
                candidate_id=candidate.id,
                previous_stage=old_stage,
                new_stage=new_stage,
                note=data.get('note', 'Stage updated via edit')
            )
            db.session.add(history)

        # Update fields
        for key, value in validated.items():
            setattr(candidate, key, value)
        candidate.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        return jsonify({'candidate': candidate.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/<int:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    """Delete a candidate and their stage history."""
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'error': f'Candidate with ID {candidate_id} not found'}), 404

    try:
        db.session.delete(candidate)
        db.session.commit()
        return jsonify({'message': f'Candidate {candidate_id} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/<int:candidate_id>/stage', methods=['PATCH'])
def update_stage(candidate_id):
    """Update candidate hiring stage."""
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'error': f'Candidate with ID {candidate_id} not found'}), 404

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        try:
            validated = stage_update_schema.load(data)
        except ValidationError as err:
            return jsonify({'error': 'Validation failed', 'details': err.messages}), 422

        new_stage = validated['stage']
        old_stage = candidate.stage

        if new_stage == old_stage:
            return jsonify({'candidate': candidate.to_dict(), 'message': 'Stage unchanged'}), 200

        # Record history
        history = StageHistory(
            candidate_id=candidate.id,
            previous_stage=old_stage,
            new_stage=new_stage,
            note=validated.get('note')
        )
        db.session.add(history)

        # Update candidate
        candidate.stage = new_stage
        candidate.updated_at = datetime.now(timezone.utc)

        db.session.commit()
        return jsonify({
            'candidate': candidate.to_dict(),
            'message': f'Stage updated from {old_stage} to {new_stage}'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@candidates_bp.route('/<int:candidate_id>/history', methods=['GET'])
def get_candidate_history(candidate_id):
    """Get stage history for a candidate."""
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'error': f'Candidate with ID {candidate_id} not found'}), 404

    history = StageHistory.query.filter_by(candidate_id=candidate_id)\
        .order_by(StageHistory.changed_at.desc()).all()
    return jsonify({'history': [h.to_dict() for h in history]}), 200
