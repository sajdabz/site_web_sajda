import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Send,
  Sparkles,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function QuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // userAnswers: { [question_id]: [selected_option_id, ...] }
  const [answers, setAnswers] = useState({});

  // Timer
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const startQuiz = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/start`);
        setQuizData(res.data);
        if (res.data.duration_minutes && res.data.duration_minutes > 0) {
          setTimeLeft(res.data.duration_minutes * 60);
        }
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("Failed to start quiz:", err);
        setError(
          err.response?.data?.detail || 'Unable to load quiz. Please make sure you are logged in.'
        );
      } finally {
        setLoading(false);
      }
    };

    startQuiz();
  }, [id]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || submitting) return;

    if (timeLeft <= 0) {
      // Auto submit when time runs out
      handleSubmitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const handleOptionToggle = (questionId, optionId, questionType) => {
    setAnswers((prev) => {
      const currentSelected = prev[questionId] || [];
      if (questionType === 'multiple') {
        if (currentSelected.includes(optionId)) {
          return {
            ...prev,
            [questionId]: currentSelected.filter((id) => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentSelected, optionId],
          };
        }
      } else {
        // Single choice
        return {
          ...prev,
          [questionId]: [optionId],
        };
      }
    });
  };

  const handleSubmitQuiz = async (force = false) => {
    if (submitting) return;

    if (!force && getUnansweredCount() > 0 && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setSubmitting(true);

    const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const submissionPayload = {
      quiz_id: parseInt(id),
      time_spent_seconds: timeSpentSeconds,
      answers: quizData.questions.map((q) => ({
        question_id: q.id,
        selected_option_ids: answers[q.id] || [],
      })),
    };

    try {
      const res = await api.post('/quizzes/submit', submissionPayload);
      // Navigate to results page passing the evaluation result state
      navigate(`/quizzes/${id}/result`, { state: { result: res.data } });
    } catch (err) {
      console.error("Submission failed:", err);
      alert(err.response?.data?.detail || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getUnansweredCount = () => {
    if (!quizData) return 0;
    return quizData.questions.filter((q) => !(answers[q.id] && answers[q.id].length > 0)).length;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Generating randomized quiz session..." size="lg" />
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200 dark:border-rose-900 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Unavailable</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Unable to load quiz session.'}</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const currentQ = quizData.questions[currentIndex];
  const currentAnswers = answers[currentQ.id] || [];
  const progressPercent = Math.round(((currentIndex + 1) / quizData.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Quiz Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
            {quizData.subject?.name || 'Quiz'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {quizData.title}
          </h2>
        </div>

        {timeLeft !== null && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
              timeLeft < 120
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time Left: {formatTimer(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar & Question Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            Question {currentIndex + 1} of {quizData.questions.length}
          </span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Navigation Question Pills */}
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        {quizData.questions.map((q, idx) => {
          const isAnswered = answers[q.id] && answers[q.id].length > 0;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                isCurrent
                  ? 'ring-2 ring-primary-500 bg-primary-600 text-white shadow-md'
                  : isAnswered
                  ? 'bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current Question Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-primary-600 dark:text-primary-400">
              Question {currentIndex + 1}
            </span>
            {currentQ.question_type === 'multiple' && (
              <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                Multiple choices: Select all that apply
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswers.includes(opt.id);
            return (
              <div
                key={opt.id}
                onClick={() => handleOptionToggle(currentQ.id, opt.id, currentQ.question_type)}
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div
                  className={`mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors ${
                    currentQ.question_type === 'multiple'
                      ? `rounded-md border ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`
                      : `rounded-full border-2 ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
                  {opt.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls: Prev / Next / Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentIndex < quizData.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(quizData.questions.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmitQuiz(false)}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Unanswered questions */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Unanswered Questions Confirmation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              You have <strong>{getUnansweredCount()} unanswered question(s)</strong>. Are you sure you
              want to submit your quiz now?
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Review Questions
            </button>
            <button
              onClick={() => handleSubmitQuiz(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              Submit Anyway
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
