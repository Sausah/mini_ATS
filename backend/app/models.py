from datetime import datetime, timezone
from app.extensions import db

VALID_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']
VALID_SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Company Website', 'Glassdoor', 'Other']
VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
VALID_JOB_STATUSES = ['Open', 'Closed', 'On Hold']
VALID_INTERVIEW_TYPES = [
    'Technical Round', 'HR Screening', 'Managerial Interview', 'System Design', 'Final Round'
]
VALID_INTERVIEW_STATUSES = ['Scheduled', 'Completed', 'Cancelled']


class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    employment_type = db.Column(db.String(50), nullable=False, default='Full-time')
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Open')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    candidates = db.relationship('Candidate', back_populates='job', lazy='dynamic')
    interviews = db.relationship('Interview', back_populates='job', lazy='dynamic')

    def to_dict(self, include_candidate_count=True):
        data = {
            'id': self.id,
            'title': self.title,
            'department': self.department,
            'location': self.location,
            'employment_type': self.employment_type,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        if include_candidate_count:
            data['candidate_count'] = self.candidates.count()
        return data

    def __repr__(self):
        return f'<Job {self.id}: {self.title}>'


class Candidate(db.Model):
    __tablename__ = 'candidates'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    phone = db.Column(db.String(20), nullable=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True, index=True)
    stage = db.Column(db.String(20), nullable=False, default='Applied', index=True)
    resume_url = db.Column(db.String(500), nullable=True)
    source = db.Column(db.String(50), nullable=True, default='Other')
    notes = db.Column(db.Text, nullable=True)
    applied_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    job = db.relationship('Job', back_populates='candidates')
    stage_history = db.relationship('StageHistory', back_populates='candidate',
                                    cascade='all, delete-orphan', lazy='dynamic',
                                    order_by='StageHistory.changed_at')
    interviews = db.relationship('Interview', back_populates='candidate',
                                 cascade='all, delete-orphan', lazy='dynamic',
                                 order_by='Interview.scheduled_at')

    def to_dict(self, include_history=False, include_interviews=True):
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else None,
            'stage': self.stage,
            'resume_url': self.resume_url,
            'source': self.source,
            'notes': self.notes,
            'applied_at': self.applied_at.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        if include_history:
            data['stage_history'] = [h.to_dict() for h in self.stage_history]
        if include_interviews:
            data['interviews'] = [i.to_dict() for i in self.interviews]
        return data

    def __repr__(self):
        return f'<Candidate {self.id}: {self.full_name}>'


class StageHistory(db.Model):
    __tablename__ = 'stage_history'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'),
                             nullable=False, index=True)
    previous_stage = db.Column(db.String(20), nullable=True)
    new_stage = db.Column(db.String(20), nullable=False)
    changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    note = db.Column(db.Text, nullable=True)

    # Relationships
    candidate = db.relationship('Candidate', back_populates='stage_history')

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'previous_stage': self.previous_stage,
            'new_stage': self.new_stage,
            'changed_at': self.changed_at.isoformat(),
            'note': self.note,
        }

    def __repr__(self):
        return f'<StageHistory {self.id}: {self.previous_stage} -> {self.new_stage}>'


class Interview(db.Model):
    __tablename__ = 'interviews'

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'),
                             nullable=False, index=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='SET NULL'),
                       nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    interview_type = db.Column(db.String(50), nullable=False, default='Technical Round')
    scheduled_at = db.Column(db.DateTime, nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, nullable=False, default=45)
    interviewer_name = db.Column(db.String(100), nullable=False, default='Recruiter Admin')
    interviewer_email = db.Column(db.String(255), nullable=True)
    meeting_link = db.Column(db.String(500), nullable=True)
    location = db.Column(db.String(200), nullable=True, default='Google Meet')
    status = db.Column(db.String(20), nullable=False, default='Scheduled')
    notes = db.Column(db.Text, nullable=True)
    email_sent = db.Column(db.Boolean, default=False)
    email_sent_at = db.Column(db.DateTime, nullable=True)
    email_subject = db.Column(db.String(300), nullable=True)
    email_body = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    candidate = db.relationship('Candidate', back_populates='interviews')
    job = db.relationship('Job', back_populates='interviews')

    def to_dict(self):
        cand_name = self.candidate.full_name if self.candidate else None
        cand_email = self.candidate.email if self.candidate else None
        job_title = None
        if self.job:
            job_title = self.job.title
        elif self.candidate and self.candidate.job:
            job_title = self.candidate.job.title

        return {
            'id': self.id,
            'candidate_id': self.candidate_id,
            'candidate_name': cand_name,
            'candidate_email': cand_email,
            'job_id': self.job_id,
            'job_title': job_title,
            'title': self.title,
            'interview_type': self.interview_type,
            'scheduled_at': self.scheduled_at.isoformat(),
            'duration_minutes': self.duration_minutes,
            'interviewer_name': self.interviewer_name,
            'interviewer_email': self.interviewer_email,
            'meeting_link': self.meeting_link,
            'location': self.location,
            'status': self.status,
            'notes': self.notes,
            'email_sent': self.email_sent,
            'email_sent_at': self.email_sent_at.isoformat() if self.email_sent_at else None,
            'email_subject': self.email_subject,
            'email_body': self.email_body,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f'<Interview {self.id}: {self.title} on {self.scheduled_at}>'


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='admin')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
        }

    def __repr__(self):
        return f'<User {self.id}: {self.email} ({self.role})>'

