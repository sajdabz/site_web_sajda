# EduLearn Frontend

A modern, responsive, mobile-first single-page educational application built with **React 18**, **Vite**, **React Router**, and **Tailwind CSS**.

## Features
- **Dynamic Quiz Taking Engine**:
  - Interactive timer countdown (turns red in final 2 minutes).
  - Anti-cheating randomized question and answer order on every session.
  - Radio/Checkbox toggling for single-choice and multiple-choice questions.
  - Question quick-jump navigation palette and progress bar.
  - Confirmation modal for unanswered questions before submission.
- **Detailed Evaluation & Feedback**:
  - Instant score percentage and pass/fail indicators.
  - Question review with highlighted correct choices, student choices, and conceptual explanations.
  - Retake button with immediate re-randomization.
- **Student Dashboard**:
  - Key statistics: Total tests taken, passed tests, average score.
  - Performance bar chart and subject mastery progress bars.
  - Attempt history table with direct links to past mistake reviews.
- **Resource Repository**:
  - Multi-criteria filtering by subject, format (PDF, video, article), and academic level.
  - Instant search bar.
  - Direct download links for PDF cheat sheets and course materials.
- **Admin Control Panel**:
  - Platform overview analytics (users, subjects, resources, quizzes, attempts).
  - Complete CRUD for academic disciplines, resources (with PDF uploads or URLs), and quizzes.
  - Question manager with 2-6 options, correct answer selectors, and explanations.
  - Bulk question import via JSON or CSV file upload.
  - User role promotion/demotion.
- **Design & UX**:
  - Persistent Dark / Light mode toggle.
  - Fully responsive mobile drawer navigation.
  - Pre-filled demo credential buttons for instant testing.

---

## Getting Started

### 1. Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### 2. Environment Variables (Optional)
By default, the frontend connects to the local backend API at `http://localhost:8000/api`.
To customize, create `.env` in the `frontend` folder:
```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Production Build
```bash
npm run build
npm run preview
```
