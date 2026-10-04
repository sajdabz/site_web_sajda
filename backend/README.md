# EduLearn Backend API

A high-performance, modular educational backend built with **Python 3.11+**, **FastAPI**, **SQLAlchemy**, and **Pydantic**.

## Features
- **JWT Authentication**: Secure user registration and login with bcrypt hashing and role-based permissions (`student` and `admin`).
- **Resource Repository**: Support for PDFs (with local uploads/downloads), external videos, and educational articles with multi-criteria filtering (subject, type, level, search query).
- **Randomized QCM Quizzes**:
  - Questions and answer options shuffle randomly on every attempt session.
  - Supports single-choice and multiple-choice questions.
  - Zero answer leakage: correct answers and explanations are stripped on quiz start.
  - Server-side grading with score calculation, percentage, and detailed feedback review.
- **Student Progress Dashboard**: Attempt history tracking, passed quizzes counter, and average score statistics.
- **Admin Panel API**:
  - Full CRUD for subjects, resources, quizzes, and questions.
  - Bulk import of questions via JSON or CSV.
  - Global platform analytics and user management.

---

## Getting Started

### 1. Requirements
- Python 3.11 or higher (Compatible with Python 3.11, 3.12, 3.13, 3.14)

### 2. Environment Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration uses SQLite (`sqlite:///./app.db`). To use PostgreSQL later, change `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/edulearn"
```

### 4. Database Initialization & Seed Data
Run the seed script to create all database tables and populate sample subjects (Mathematics, Physics, Computer Science), 10 resources, and 3 quizzes with 15 questions each:
```bash
python app/seed.py
```

Default seeded accounts:
- **Admin**: `admin@edulearn.org` / `admin123`
- **Student**: `student@edulearn.org` / `student123`

### 5. Running the Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

### 6. Running Tests
```bash
pytest tests -v
```
