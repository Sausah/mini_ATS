from flask import Blueprint, jsonify
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from app.extensions import db
from app.models import Candidate, Job, StageHistory, VALID_STAGES

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard metrics computed from the database."""
    try:
        # Total candidates
        total_candidates = Candidate.query.count()

        # Stage distribution
        stage_counts = db.session.query(
            Candidate.stage, func.count(Candidate.id).label('count')
        ).group_by(Candidate.stage).all()

        stage_map = {row.stage: row.count for row in stage_counts}

        # Ensure all stages are represented
        stage_distribution = [
            {'stage': stage, 'count': stage_map.get(stage, 0)}
            for stage in VALID_STAGES
        ]

        # Active applications (not Hired or Rejected)
        active_applications = Candidate.query.filter(
            ~Candidate.stage.in_(['Hired', 'Rejected'])
        ).count()

        # Metrics by stage
        in_screening = stage_map.get('Screening', 0)
        in_interview = stage_map.get('Interview', 0)
        offers_made = stage_map.get('Offer', 0)
        total_hires = stage_map.get('Hired', 0)
        total_rejections = stage_map.get('Rejected', 0)

        # Applications over time (last 30 days, by day)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        apps_over_time_raw = db.session.query(
            func.date(Candidate.applied_at).label('date'),
            func.count(Candidate.id).label('count')
        ).filter(
            Candidate.applied_at >= thirty_days_ago
        ).group_by(
            func.date(Candidate.applied_at)
        ).order_by(
            func.date(Candidate.applied_at)
        ).all()

        apps_over_time = [
            {'date': str(row.date), 'count': row.count}
            for row in apps_over_time_raw
        ]

        # Recent activity (last 10 stage changes)
        recent_activity_raw = db.session.query(
            StageHistory, Candidate.full_name
        ).join(
            Candidate, StageHistory.candidate_id == Candidate.id
        ).order_by(
            StageHistory.changed_at.desc()
        ).limit(10).all()

        recent_activity = [
            {
                'id': sh.id,
                'candidate_id': sh.candidate_id,
                'candidate_name': name,
                'previous_stage': sh.previous_stage,
                'new_stage': sh.new_stage,
                'changed_at': sh.changed_at.isoformat(),
                'note': sh.note,
            }
            for sh, name in recent_activity_raw
        ]

        # Job stats
        total_jobs = Job.query.count()
        open_jobs = Job.query.filter_by(status='Open').count()

        # Source distribution
        source_dist_raw = db.session.query(
            Candidate.source, func.count(Candidate.id).label('count')
        ).group_by(Candidate.source).all()
        source_distribution = [
            {'source': row.source or 'Other', 'count': row.count}
            for row in source_dist_raw
        ]

        return jsonify({
            'metrics': {
                'total_candidates': total_candidates,
                'active_applications': active_applications,
                'in_screening': in_screening,
                'in_interview': in_interview,
                'offers_made': offers_made,
                'total_hires': total_hires,
                'total_rejections': total_rejections,
                'total_jobs': total_jobs,
                'open_jobs': open_jobs,
            },
            'stage_distribution': stage_distribution,
            'apps_over_time': apps_over_time,
            'recent_activity': recent_activity,
            'source_distribution': source_distribution,
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
