from flask import Blueprint, jsonify
from app.models import Candidate, VALID_STAGES

pipeline_bp = Blueprint('pipeline', __name__)


@pipeline_bp.route('', methods=['GET'])
def get_pipeline():
    """Get candidates grouped by hiring stage for the pipeline view."""
    try:
        pipeline = {}
        for stage in VALID_STAGES:
            candidates = Candidate.query.filter_by(stage=stage)\
                .order_by(Candidate.applied_at.desc()).all()
            pipeline[stage] = [c.to_dict() for c in candidates]

        return jsonify({
            'pipeline': pipeline,
            'stages': VALID_STAGES,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
