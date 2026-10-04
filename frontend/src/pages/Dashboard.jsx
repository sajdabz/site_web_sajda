import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Award,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  Calendar,
  RotateCcw,
  ArrowRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/quizzes/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Loading your academic progress..." size="lg" />
      </div>
    );
  }

  const hasAttempts = stats && stats.total_attempts > 0;
  const recentAttempts = stats?.recent_attempts || [];
  const subjectPerformance = stats?.subject_performance || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Student Performance Center
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your scores, analyze past attempts, and measure your subject mastery over time.
          </p>
        </div>

        <Link
          to="/quizzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          Take a Quiz
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Quizzes Taken
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.total_attempts || 0}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quizzes Passed
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.quizzes_passed || 0}
            </h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Score
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.average_score || 0}%
            </h3>
          </div>
        </div>
      </div>

      {/* Progress Chart and Subject Breakdown */}
      {hasAttempts ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Score History Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Score Evolution (Recent Attempts)
                </h3>
                <p className="text-xs text-slate-400">
                  Visual history of your latest quiz scores in percentage
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-primary-500" />
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-48 pt-6 flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-100 dark:border-slate-700 pb-2">
              {recentAttempts.slice(0, 8).reverse().map((att, idx) => {
                const heightPercent = Math.max(10, Math.min(100, att.percentage));
                const isPass = att.passed;
                return (
                  <div key={att.id} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {att.percentage}%
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:brightness-110 shadow-sm ${
                        isPass
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : 'bg-gradient-to-t from-rose-500 to-amber-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-slate-400 font-medium truncate w-14 text-center">
                      #{recentAttempts.length - idx}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Passed (≥ 50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Needs Improvement</span>
              </div>
            </div>
          </div>

          {/* Subject Performance Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Subject Mastery
            </h3>
            <p className="text-xs text-slate-400">
              Average score across completed tests
            </p>

            <div className="space-y-4 pt-2">
              {subjectPerformance.map((subj) => (
                <div key={subj.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{subj.subject}</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      {subj.avg_score}% ({subj.attempts} test{subj.attempts > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${subj.avg_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
          <Award className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              No Quiz Attempts Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Take your first randomized practice quiz to view performance analytics, score charts,
              and question explanations!
            </p>
          </div>
          <Link
            to="/quizzes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20"
          >
            <HelpCircle className="w-4 h-4" />
            Explore Practice Quizzes
          </Link>
        </div>
      )}

      {/* Attempt History Table */}
      {hasAttempts && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Quiz Attempt History
            </h3>
            <span className="text-xs text-slate-400">{recentAttempts.length} total attempts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 px-2">Quiz Title</th>
                  <th className="pb-3 px-2">Subject</th>
                  <th className="pb-3 px-2">Score</th>
                  <th className="pb-3 px-2">Result</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {recentAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-4 px-2 font-semibold text-slate-900 dark:text-slate-100">
                      {att.quiz_title}
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {att.subject_name}
                      </span>
                    </td>
                    <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">
                      {att.percentage}% ({att.score}/{att.total_questions})
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          att.passed
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}
                      >
                        {att.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-xs text-slate-400">
                      {new Date(att.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <Link
                        to={`/quizzes/attempts/${att.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Review Mistakes <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
