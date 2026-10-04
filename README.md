# EduLearn - Production-Grade Educational Platform

EduLearn is a modern, full-stack educational learning platform where students can browse multi-format study resources (PDFs, video lectures, guides) and practice with **randomized QCMs (multiple-choice quizzes)** whose questions and answer options shuffle randomly every single attempt.

---

## Tech Stack

- **Backend**:
  - Python 3.11+
  - **FastAPI** (REST API with automatic Swagger OpenAPI docs)
  - **SQLAlchemy ORM** + Pydantic v2
  - **SQLite** database (zero setup, switchable to PostgreSQL via `DATABASE_URL` in `.env`)
  - **JWT Authentication** (`PyJWT` + `bcrypt` secure password hashing)
  - **Pytest** + `HTTPX` automated test suite
- **Frontend**:
  - **React 18** + **Vite**
  - **Tailwind CSS** with dark/light mode toggle
  - **React Router v6**
  - **Axios** with automatic token interceptors
  - **Lucide React** modern icons

---

## Project Structure

```text
siteweb/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, database engine, security (bcrypt & JWT), dependencies
│   │   ├── models/         # SQLAlchemy models (User, Subject, Resource, Quiz, Question, Option, Attempt)
│   │   ├── schemas/        # Pydantic v2 schemas for request validation & responses
│   │   ├── routers/        # API route handlers (auth, subjects, resources, quizzes, admin)
│   │   ├── services/       # Quiz shuffling, random question sampling & server-side grading
│   │   ├── seed.py         # Seed script with sample subjects, resources & quizzes
│   │   └── main.py         # FastAPI application entry point with CORS & static file mounting
│   ├── tests/              # Automated pytest suites (auth, quizzes, anti-cheating, admin CRUD, bulk import)
│   ├── uploads/            # Storage directory for downloadable course PDFs
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variables template
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API client configured with auth interceptors
│   │   ├── context/        # AuthContext (roles, tokens) & ThemeContext (dark/light mode)
│   │   ├── components/     # Navbar, Footer, ProtectedRoute, AdminRoute, Modal, LoadingSpinner
│   │   ├── pages/          # Home, Resources, Quizzes, QuizTake, QuizResult, Dashboard, AdminDashboard, Login, Register
│   │   ├── App.jsx         # Application routing setup
│   │   └── index.css       # Tailwind CSS base styles & custom scrollbars
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tailwind.config.js  # Tailwind theme configuration
│   └── README.md
└── README.md               # Root documentation
```

---

## Quick Start Guide

### 1. Backend Setup & Run

Open a terminal in the project root:

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
# Windows:
py -m venv venv
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# python3 -m venv venv
# source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize database and seed sample data
python app/seed.py

# 5. Start the backend development server
uvicorn app.main:app --reload --port 8000
```

The backend API and interactive documentation will be available at:
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 2. Frontend Setup & Run

Open a second terminal window:

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start Vite development server
npm run dev
```

Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## Default Accounts

The database comes pre-seeded with sample accounts and data:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@edulearn.org` | `admin123` | Full Admin Panel, Question/Quiz CRUD, Resource Uploads, Bulk Import |
| **Student** | `student@edulearn.org` | `student123` | Resource browsing/download, Quiz practice, Personal Dashboard |

> **Tip**: The login screen features one-click **"Autofill Student"** and **"Autofill Admin"** demo buttons for instantaneous testing.

---

## Key Features & Highlights

### 1. Randomized Anti-Cheating QCM Quizzes
- **Zero Answer Leakage**: The start endpoint (`/api/quizzes/{id}/start`) transmits only question text and option choices without correct indicators or explanations.
- **Server-Side Shuffling**: Questions and their options are re-shuffled dynamically on every single attempt.
- **Question Bank Sampling**: Supports picking $N$ random questions out of a larger pool.
- **Countdown Timer**: Real-time timer with urgent alert during the final 2 minutes.
- **Comprehensive Review**: Server computes score and percentage, returns mistake review highlighting student choices vs correct answers alongside conceptual explanations.

### 2. Resource Repository
- Categorized by academic discipline (Mathematics, Physics, Computer Science) and study level.
- Multi-format support: PDF downloads (with download counter tracking), curated video lectures, and web articles.
- Instant search filter by keyword and subject pill.

### 3. Student Progress Dashboard
- Summary indicators: Total Quizzes Attempted, Quizzes Passed, Average Score.
- Visual score evolution chart (SVG bar chart) tracking recent quiz scores.
- Subject mastery bars.
- Attempt history table with direct links to review mistakes.

### 4. Admin Management Panel
- Platform overview statistics.
- Subjects CRUD with custom icons, color palettes, and levels.
- Resources CRUD with PDF file upload or direct external URLs.
- Quiz & Question management with single/multiple choice options and explanations.
- **Bulk Question Import**: Upload a CSV file or paste a JSON array of questions to instantly populate quizzes.
- User management with student-to-admin role elevation.

---

## Running Automated Backend Tests

To run the backend test suite (9 integration and unit tests covering auth, anti-cheating, quiz grading, and admin bulk import):

```bash
cd backend
pytest tests -v
```

---

## Switching to PostgreSQL

To switch from SQLite to PostgreSQL for production:
1. Ensure your PostgreSQL server is running.
2. In `backend/.env`, update the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/edulearn"
   ```
3. Run `python app/seed.py` to create the schema and populate initial data.
