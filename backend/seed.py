"""
Seed script for Mini ATS.
Populates the database with realistic synthetic data.
Safe to re-run — checks for existing data before inserting.

Usage:
    cd backend
    python seed.py
"""

import os
import sys
from datetime import datetime, timezone, timedelta
import random

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import Job, Candidate, StageHistory, User, Interview, VALID_STAGES, VALID_SOURCES

app = create_app('development')

JOBS_DATA = [
    {
        'title': 'Senior Software Engineer',
        'department': 'Engineering',
        'location': 'Remote',
        'employment_type': 'Full-time',
        'description': 'We are looking for an experienced Senior Software Engineer to join our team.',
        'status': 'Open',
    },
    {
        'title': 'Product Manager',
        'department': 'Product',
        'location': 'New York, NY',
        'employment_type': 'Full-time',
        'description': 'Lead product strategy and roadmap for our core platform.',
        'status': 'Open',
    },
    {
        'title': 'UX Designer',
        'department': 'Design',
        'location': 'San Francisco, CA',
        'employment_type': 'Full-time',
        'description': 'Create beautiful user experiences for millions of users.',
        'status': 'Open',
    },
    {
        'title': 'Data Analyst',
        'department': 'Analytics',
        'location': 'Remote',
        'employment_type': 'Full-time',
        'description': 'Analyze data to drive business insights and decisions.',
        'status': 'Open',
    },
    {
        'title': 'Marketing Manager',
        'department': 'Marketing',
        'location': 'Austin, TX',
        'employment_type': 'Full-time',
        'description': 'Drive marketing strategy and brand growth.',
        'status': 'Closed',
    },
    {
        'title': 'DevOps Engineer',
        'department': 'Engineering',
        'location': 'Remote',
        'employment_type': 'Full-time',
        'description': 'Build and maintain our cloud infrastructure.',
        'status': 'Open',
    },
]

CANDIDATES_DATA = [
    {'full_name': 'Aarav Sharma', 'email': 'aarav.sharma@example.com', 'phone': '+91-9876543210', 'stage': 'Hired', 'source': 'LinkedIn'},
    {'full_name': 'Priya Patel', 'email': 'priya.patel@example.com', 'phone': '+91-9876543211', 'stage': 'Interview', 'source': 'Referral'},
    {'full_name': 'Ravi Kumar', 'email': 'ravi.kumar@example.com', 'phone': '+91-9876543212', 'stage': 'Screening', 'source': 'Indeed'},
    {'full_name': 'Sneha Reddy', 'email': 'sneha.reddy@example.com', 'phone': '+91-9876543213', 'stage': 'Applied', 'source': 'Company Website'},
    {'full_name': 'Arjun Singh', 'email': 'arjun.singh@example.com', 'phone': '+91-9876543214', 'stage': 'Offer', 'source': 'LinkedIn'},
    {'full_name': 'Meera Nair', 'email': 'meera.nair@example.com', 'phone': '+91-9876543215', 'stage': 'Rejected', 'source': 'Glassdoor'},
    {'full_name': 'Vikram Gupta', 'email': 'vikram.gupta@example.com', 'phone': '+91-9876543216', 'stage': 'Interview', 'source': 'LinkedIn'},
    {'full_name': 'Ananya Iyer', 'email': 'ananya.iyer@example.com', 'phone': '+91-9876543217', 'stage': 'Screening', 'source': 'Indeed'},
    {'full_name': 'Rahul Verma', 'email': 'rahul.verma@example.com', 'phone': '+91-9876543218', 'stage': 'Applied', 'source': 'Referral'},
    {'full_name': 'Kavya Menon', 'email': 'kavya.menon@example.com', 'phone': '+91-9876543219', 'stage': 'Hired', 'source': 'LinkedIn'},
    {'full_name': 'Suresh Joshi', 'email': 'suresh.joshi@example.com', 'phone': '+91-9876543220', 'stage': 'Applied', 'source': 'Company Website'},
    {'full_name': 'Divya Bhat', 'email': 'divya.bhat@example.com', 'phone': '+91-9876543221', 'stage': 'Screening', 'source': 'Glassdoor'},
    {'full_name': 'Nikhil Tiwari', 'email': 'nikhil.tiwari@example.com', 'phone': '+91-9876543222', 'stage': 'Interview', 'source': 'LinkedIn'},
    {'full_name': 'Pooja Desai', 'email': 'pooja.desai@example.com', 'phone': '+91-9876543223', 'stage': 'Offer', 'source': 'Indeed'},
    {'full_name': 'Aditya Rao', 'email': 'aditya.rao@example.com', 'phone': '+91-9876543224', 'stage': 'Rejected', 'source': 'Referral'},
    {'full_name': 'Shruti Pillai', 'email': 'shruti.pillai@example.com', 'phone': '+91-9876543225', 'stage': 'Applied', 'source': 'LinkedIn'},
    {'full_name': 'Kiran Mehta', 'email': 'kiran.mehta@example.com', 'phone': '+91-9876543226', 'stage': 'Screening', 'source': 'Company Website'},
    {'full_name': 'Rohit Bansal', 'email': 'rohit.bansal@example.com', 'phone': '+91-9876543227', 'stage': 'Interview', 'source': 'LinkedIn'},
    {'full_name': 'Nisha Agarwal', 'email': 'nisha.agarwal@example.com', 'phone': '+91-9876543228', 'stage': 'Applied', 'source': 'Indeed'},
    {'full_name': 'Amit Chauhan', 'email': 'amit.chauhan@example.com', 'phone': '+91-9876543229', 'stage': 'Hired', 'source': 'Referral'},
    {'full_name': 'Swati Kapoor', 'email': 'swati.kapoor@example.com', 'phone': '+91-9876543230', 'stage': 'Rejected', 'source': 'Glassdoor'},
    {'full_name': 'Manoj Saxena', 'email': 'manoj.saxena@example.com', 'phone': '+91-9876543231', 'stage': 'Screening', 'source': 'LinkedIn'},
    {'full_name': 'Lakshmi Krishnan', 'email': 'lakshmi.krishnan@example.com', 'phone': '+91-9876543232', 'stage': 'Interview', 'source': 'Referral'},
    {'full_name': 'Gaurav Mishra', 'email': 'gaurav.mishra@example.com', 'phone': '+91-9876543233', 'stage': 'Applied', 'source': 'Company Website'},
    {'full_name': 'Ritika Malhotra', 'email': 'ritika.malhotra@example.com', 'phone': '+91-9876543234', 'stage': 'Offer', 'source': 'LinkedIn'},
]

STAGE_PROGRESSIONS = {
    'Applied': [],
    'Screening': ['Applied'],
    'Interview': ['Applied', 'Screening'],
    'Offer': ['Applied', 'Screening', 'Interview'],
    'Hired': ['Applied', 'Screening', 'Interview', 'Offer'],
    'Rejected': ['Applied', 'Screening'],
}

NOTES = [
    'Strong technical background.',
    'Excellent communication skills.',
    'Good culture fit.',
    'Needs further evaluation.',
    'Impressive portfolio.',
    'Scheduling interview next week.',
    'Reference check in progress.',
    'Offer extended and under consideration.',
    'Declined due to salary expectations.',
    None,
]


def seed():
    with app.app_context():
        # Ensure all tables exist (including users)
        db.create_all()

        # Ensure default Admin user
        admin_user = User.query.filter_by(email='admin@miniats.com').first()
        if not admin_user:
            admin_user = User(
                name='Recruiter Admin',
                email='admin@miniats.com',
                role='admin',
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print('[OK] Admin user created: admin@miniats.com (password: admin123)')
        # Ensure sample interviews if none exist
        if Interview.query.count() == 0:
            candidates = Candidate.query.limit(4).all()
            if candidates:
                base_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
                interview_samples = [
                    {
                        'candidate': candidates[0],
                        'title': f"Technical Round with {candidates[0].full_name}",
                        'type': 'Technical Round',
                        'offset_hours': 2,
                        'duration': 45,
                        'status': 'Scheduled',
                    },
                    {
                        'candidate': candidates[1] if len(candidates) > 1 else candidates[0],
                        'title': f"HR Screening with {(candidates[1] if len(candidates) > 1 else candidates[0]).full_name}",
                        'type': 'HR Screening',
                        'offset_hours': 5,
                        'duration': 30,
                        'status': 'Scheduled',
                    },
                    {
                        'candidate': candidates[2] if len(candidates) > 2 else candidates[0],
                        'title': f"System Design with {(candidates[2] if len(candidates) > 2 else candidates[0]).full_name}",
                        'type': 'System Design',
                        'offset_hours': 26, # tomorrow
                        'duration': 60,
                        'status': 'Scheduled',
                    },
                ]

                for item in interview_samples:
                    cand = item['candidate']
                    sched_time = base_time + timedelta(hours=item['offset_hours'])
                    sub = f"Interview Invitation: {cand.job.title if cand.job else 'Software Role'} at Mini ATS"
                    inv = Interview(
                        candidate_id=cand.id,
                        job_id=cand.job_id,
                        title=item['title'],
                        interview_type=item['type'],
                        scheduled_at=sched_time,
                        duration_minutes=item['duration'],
                        interviewer_name='Recruiter Admin',
                        interviewer_email='admin@miniats.com',
                        meeting_link='https://meet.google.com/ats-interview-session',
                        location='Google Meet',
                        status=item['status'],
                        notes='Please review the candidate resume beforehand.',
                        email_sent=True,
                        email_sent_at=datetime.now(timezone.utc),
                        email_subject=sub,
                        email_body=f"Dear {cand.full_name},\n\nWe are pleased to invite you to an interview on {sched_time.strftime('%b %d, %Y at %I:%M %p')}.\n\nMeeting link: https://meet.google.com/ats-interview-session",
                    )
                    db.session.add(inv)
                db.session.commit()
                print(f"[OK] Seeded {len(interview_samples)} interview appointments.")

        # Check if candidate/job data already exists
        if Job.query.count() > 0:
            print('[INFO] Database already has candidate & job data. Skipping sample data seed.')
            return

        print('[SEED] Seeding database...')

        # Create jobs
        jobs = []
        for job_data in JOBS_DATA:
            job = Job(**job_data)
            db.session.add(job)
            jobs.append(job)
        db.session.flush()
        print(f'[OK] Created {len(jobs)} jobs')

        # Create candidates
        now = datetime.now(timezone.utc)
        candidates = []
        for i, cdata in enumerate(CANDIDATES_DATA):
            # Random application date within last 60 days
            days_ago = random.randint(1, 60)
            applied_at = now - timedelta(days=days_ago)

            job = random.choice(jobs[:5])  # Assign to open jobs mostly
            notes = random.choice(NOTES)
            resume_url = f'https://example.com/resumes/{cdata["email"].split("@")[0]}.pdf'

            candidate = Candidate(
                full_name=cdata['full_name'],
                email=cdata['email'],
                phone=cdata['phone'],
                job_id=job.id,
                stage=cdata['stage'],
                resume_url=resume_url,
                source=cdata['source'],
                notes=notes,
                applied_at=applied_at,
            )
            db.session.add(candidate)
            candidates.append(candidate)

        db.session.flush()
        print(f'[OK] Created {len(candidates)} candidates')

        # Create stage history for each candidate
        history_count = 0
        for candidate in candidates:
            progression = STAGE_PROGRESSIONS.get(candidate.stage, [])

            # Initial application
            applied_time = candidate.applied_at
            history = StageHistory(
                candidate_id=candidate.id,
                previous_stage=None,
                new_stage='Applied',
                changed_at=applied_time,
                note='Application received',
            )
            db.session.add(history)
            history_count += 1

            # Progress through stages
            prev = 'Applied'
            for stage in progression[1:]:  # Skip 'Applied' since it's already added
                days_after = random.randint(2, 7)
                applied_time = applied_time + timedelta(days=days_after)
                history = StageHistory(
                    candidate_id=candidate.id,
                    previous_stage=prev,
                    new_stage=stage,
                    changed_at=applied_time,
                    note=random.choice(NOTES),
                )
                db.session.add(history)
                history_count += 1
                prev = stage

            # Final stage if not in progression
            if candidate.stage not in progression and candidate.stage != 'Applied':
                days_after = random.randint(2, 7)
                applied_time = applied_time + timedelta(days=days_after)
                history = StageHistory(
                    candidate_id=candidate.id,
                    previous_stage=prev,
                    new_stage=candidate.stage,
                    changed_at=applied_time,
                    note=random.choice(NOTES),
                )
                db.session.add(history)
                history_count += 1

        db.session.commit()
        print(f'[OK] Created {history_count} stage history records')
        print('\n[DONE] Database seeded successfully!')
        print(f'   - {len(jobs)} jobs')
        print(f'   - {len(candidates)} candidates')
        print(f'   - {history_count} stage history records')


if __name__ == '__main__':
    seed()
