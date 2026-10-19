# Mini Applicant Tracking System (ATS)

A production-ready, full-stack Applicant Tracking System (ATS) designed to streamline candidate management, monitor recruitment pipelines, and track key hiring metrics through an interactive recruiter dashboard.

---

## 🚀 Features

- **Candidate Management**:
  - Full CRUD operations: Create, Read, Update, and Delete candidate profiles.
  - Track candidate contact details, applied position, recruitment source, resume links, and recruiter notes.
- **Search, Filter, Sort & Pagination**:
  - Full-text search by candidate name and email.
  - Multi-attribute filtering by hiring stage, job opening, and acquisition source.
  - Sorting by application date and candidate name (ascending/descending).
  - Server-side pagination with accessible pagination controls.
- **Interactive Hiring Pipeline**:
  - Visual Kanban-style board segmented across all stages: `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, and `Rejected`.
  - Instant stage progression dropdowns with optimistic UI and live database synchronization.
- **Stage History Audit Trail**:
  - Immutable timeline capturing every stage change, timestamp, and recruiter transition note.
- **Recruitment Analytics Dashboard**:
  - Real-time KPIs: Total Candidates, Active Applications, In Interview, Offers Made, Total Hires, Rejections, and Open Jobs.
  - Interactive Recharts visualizations: Hiring Stage Distribution (Bar Chart), Applications Over Time (Trend Line), and Candidate Source Breakdown.
  - Live activity feed showing the latest candidate status transitions.
- **Job Requisition Management**:
  - Create, view, edit, and safely delete job openings (with candidate assignment protection).
  - Filter and inspect candidate rosters linked directly to specific roles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + Lucide React icons
- **Routing**: React Router v7
- **HTTP Client**: Axios with centralized error normalization and request/response interceptors
- **Data Visualization**: Recharts
- **Testing**: Vitest + React Testing Library + jsdom

### Backend
- **Framework**: Python 3.13 + Flask 3.0
- **ORM & Database**: SQLAlchemy 2.0 + Flask-SQLAlchemy 3.1
- **Migrations**: Flask-Migrate 4.0 (Alembic)
- **Validation**: Marshmallow 3.21
- **CORS**: Flask-CORS
- **Testing**: Pytest 8.2 + Pytest-Flask
- **Production Server**: Gunicorn

### Database
- **Development / Testing**: SQLite / In-Memory SQLite
- **Production Ready**: PostgreSQL (via standard `DATABASE_URL` connection strings)

---

## 📁 Project Structure

```text
mini-ats/
├── .gitignore
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask application factory, CORS, blueprints
│   │   ├── config.py            # Environment configurations (Dev, Test, Prod)
│   │   ├── extensions.py        # SQLAlchemy, Migrate, CORS extensions
│   │   ├── models.py            # Job, Candidate, StageHistory ORM models
│   │   ├── schemas.py           # Marshmallow validation schemas
│   │   ├── routes/
│   │   │   ├── candidates.py    # Candidate CRUD, search, filter, stage transitions
│   │   │   ├── jobs.py          # Job requisition management
│   │   │   ├── pipeline.py      # Pipeline Kanban stage aggregation
│   │   │   └── dashboard.py     # Database-backed metrics & analytics
│   │   └── services/
│   ├── migrations/              # Alembic database migration versions
│   ├── tests/
│   │   ├── conftest.py          # Pytest fixtures and test database setup
│   │   ├── test_candidates.py   # Candidate API tests
│   │   ├── test_jobs.py         # Job management API tests
│   │   └── test_dashboard.py    # Dashboard metrics API tests
│   ├── requirements.txt         # Python dependencies
│   ├── run.py                   # Development server entry point
│   ├── seed.py                  # Realistic database seeder script
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js         # Configured Axios instance with error handling
│   │   │   ├── candidates.js    # Candidate API functions
│   │   │   ├── jobs.js          # Job API functions
│   │   │   └── dashboard.js     # Dashboard API functions
│   │   ├── components/
│   │   │   ├── CandidateForm.jsx
│   │   │   ├── CandidateTable.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SearchFilters.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── CandidateDetails.jsx
│   │   │   ├── CandidateFormPage.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Pipeline.jsx
│   │   ├── test/
│   │   │   ├── setup.js
│   │   │   └── components.test.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
└── docs/
    └── screenshots/
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
FLASK_ENV=development
SECRET_KEY=your-secure-secret-key
DATABASE_URL=sqlite:///mini_ats.db
FRONTEND_URL=http://localhost:3000
```
*For PostgreSQL in production, set:*
`DATABASE_URL=postgresql://username:password@hostname:5432/mini_ats`

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=/api
```
*(In production, set `VITE_API_BASE_URL=https://your-backend-api.com/api`)*

### 🔐 Default Admin Credentials
- **Email**: `admin@miniats.com`
- **Password**: `admin123`
- *(Or click the **1-Click Demo Admin Login** button on the sign-in page)*


---

## 🏃 Local Setup & Run Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
flask db upgrade

# Seed database with sample candidates, jobs, and history
python seed.py

# Start Flask development server (port 5000)
python run.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```

Visit **http://localhost:5173** to use the application.

---

## 🧪 Automated Testing

### Backend Tests (Pytest)
```bash
cd backend
pytest -v
```
*Current test suite: **31 tests**, 100% passing across candidates, jobs, and dashboard metrics.*

### Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
*Current test suite: **5 unit tests**, 100% passing verifying component rendering, interactions, and accessibility.*

### Production Build Verification
```bash
cd frontend
npm run build
```

---

## 📡 API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check status |
| `/api/dashboard` | GET | Aggregated recruitment metrics and distributions |
| `/api/pipeline` | GET | Candidates grouped by stage for Kanban view |
| `/api/candidates` | GET | Paginated candidate search & filter |
| `/api/candidates` | POST | Create candidate profile |
| `/api/candidates/<id>` | GET | Candidate profile with stage history |
| `/api/candidates/<id>` | PUT | Update candidate details |
| `/api/candidates/<id>` | DELETE | Remove candidate |
| `/api/candidates/<id>/stage` | PATCH | Transition candidate hiring stage |
| `/api/candidates/<id>/history`| GET | Candidate stage audit log |
| `/api/jobs` | GET | List all job requisitions |
| `/api/jobs` | POST | Create new job opening |
| `/api/jobs/<id>` | GET | Get job details |
| `/api/jobs/<id>` | PUT | Update job requisition |
| `/api/jobs/<id>` | DELETE | Delete job (prevented if candidates assigned) |
| `/api/jobs/<id>/candidates` | GET | Get candidates applied to specific job |

---

## 🚢 Deployment Ready

- **Backend**: Can be hosted on Render, Railway, or Heroku using the included `gunicorn` configuration (`gunicorn run:app`).
- **Frontend**: Can be built with `npm run build` and hosted on Vercel, Netlify, or Cloudflare Pages.
- **Database**: Compatible with standard managed PostgreSQL instances (Supabase, Neon, AWS RDS, Render Postgres).
