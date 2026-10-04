import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  Shuffle,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [search, setSearch] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get('/quizzes'),
          api.get('/subjects')
        ]);
        setQuizzes(qRes.data);
        setSubjects(sRes.data);
      } catch (err) {
        console.error("Failed to load quizzes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredQuizzes = quizzes.filter((q) => {
    const matchSubject = !selectedSubject || q.subject_id === parseInt(selectedSubject);
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()));
    return matchSubject && matchSearch;
  });

  const handleStartQuiz = (quizId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/quizzes/${quizId}/take` } } });
      return;
    }
    navigate(`/quizzes/${quizId}/take`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            <Shuffle className="w-3.5 h-3.5" />
            Randomized Question Banks
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Practice Quizzes & QCMs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Questions and options are dynamically shuffled every session for authentic exam preparation.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or topic..."
            className="w-full pl-11 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Academic Disciplines</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <LoadingSpinner message="Loading quiz catalog..." />
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No quizzes match your filters</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search query or discipline selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:border-primary-400 dark:hover:border-primary-500"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900">
                    {quiz.subject?.name || 'General Subject'}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{quiz.duration_minutes ? `${quiz.duration_minutes} mins` : 'Untimed'}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                  {quiz.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {quiz.description || 'Comprehensive multiple choice assessment.'}
                </p>

                {/* Features pills */}
                <div className="flex items-center gap-3 mt-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary-500" />
                    <span>{quiz.questions_count} Questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pass: {quiz.passing_score_percentage}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Shuffle className="w-3 h-3 text-slate-400" /> Shuffled order
                </span>

                <button
                  onClick={() => handleStartQuiz(quiz.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition transform hover:-translate-y-0.5"
                >
                  <span>Start Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
