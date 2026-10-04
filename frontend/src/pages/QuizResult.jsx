import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  RotateCcw,
  LayoutDashboard,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function QuizResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'incorrect', 'correct'

  useEffect(() => {
    // If not passed through router state, fetch the latest attempt or specific attempt
    if (!result) {
      const fetchAttempt = async () => {
        try {
          const res = await api.get(`/quizzes/attempts/${id}`);
          setResult(res.data);
        } catch (err) {
          console.error("Failed to load attempt:", err);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      fetchAttempt();
    }
  }, [id, result, navigate]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Calculating and verifying quiz results..." size="lg" />
      </div>
    );
  }

  if (!result) return null;

  const passed = result.passed;
  const filteredReviews = result.reviews.filter((r) => {
    if (filterMode === 'incorrect') return !r.is_correct;
    if (filterMode === 'correct') return r.is_correct;
    return true;
  });

  const incorrectCount = result.reviews.filter((r) => !r.is_correct).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Score Card */}
      <div
        className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          passed
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:to-slate-800 border-emerald-300 dark:border-emerald-800'
            : 'bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-white dark:to-slate-800 border-rose-300 dark:border-rose-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  passed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {passed ? 'Passed Examination' : 'Needs Practice'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Pass Threshold: {result.passing_score_percentage}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {result.quiz_title}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {passed
                ? 'Outstanding performance! You have demonstrated strong mastery of the concepts.'
                : 'Good attempt! Review your mistakes below to deepen your conceptual understanding.'}
            </p>
          </div>

          {/* Big Circular Score */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-md">
              <span
                className={`text-3xl font-black ${
                  passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {result.percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {result.score}/{result.total_questions} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Correct Questions</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(result.score)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Mistakes / Review</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400">
              {incorrectCount}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Time Spent</span>
            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
              {result.time_spent_seconds} seconds
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Attempt Timestamp</span>
            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
              {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={() => navigate(`/quizzes/${result.quiz_id}/take`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Quiz (Reshuffled)
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            View Dashboard
          </Link>
          <Link
            to="/quizzes"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
          >
            All Quizzes
          </Link>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Detailed Question Review
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review correct answers, explanations, and your submitted choices.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({result.reviews.length})
            </button>
            <button
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'incorrect'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mistakes ({incorrectCount})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'correct'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Correct ({result.reviews.length - incorrectCount})
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {filteredReviews.map((item, idx) => (
            <div
              key={item.question_id}
              className={`p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-800 border transition-all ${
                item.is_correct
                  ? 'border-emerald-200 dark:border-emerald-900/60'
                  : 'border-rose-200 dark:border-rose-900/60'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Question {idx + 1}
                    </span>
                    {item.is_correct ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.text}
                  </h3>
                </div>
              </div>

              {/* Options Breakdown */}
              <div className="space-y-2 mt-4">
                {item.options.map((opt) => {
                  let optStyle =
                    'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
                  let badge = null;

                  if (opt.is_correct && opt.user_selected) {
                    optStyle =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                    badge = (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Your Choice (Correct)
                      </span>
                    );
                  } else if (opt.is_correct && !opt.user_selected) {
                    optStyle =
                      'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-medium';
                    badge = (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct Answer
                      </span>
                    );
                  } else if (!opt.is_correct && opt.user_selected) {
                    optStyle =
                      'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium';
                    badge = (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Your Choice (Incorrect)
                      </span>
                    );
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border text-sm transition-colors ${optStyle}`}
                    >
                      <span>{opt.text}</span>
                      {badge && <div className="mt-1 sm:mt-0">{badge}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note */}
              {item.explanation && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Explanation & Rationale:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
