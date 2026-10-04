import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Shuffle,
  ShieldCheck,
  TrendingUp,
  FileText,
  Video,
  ExternalLink,
  Clock,
  CheckCircle2,
  Atom,
  Calculator,
  Code
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, quizRes, resRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/quizzes'),
          api.get('/resources')
        ]);
        setSubjects(subRes.data);
        setQuizzes(quizRes.data.slice(0, 3));
        setResources(resRes.data.slice(0, 4));
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSubjectIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'calculator':
        return <Calculator className="w-6 h-6 text-indigo-500" />;
      case 'atom':
        return <Atom className="w-6 h-6 text-sky-500" />;
      case 'code':
        return <Code className="w-6 h-6 text-emerald-500" />;
      default:
        return <BookOpen className="w-6 h-6 text-primary-500" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Modern Interactive Learning Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Master Your Courses with{' '}
              <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                Dynamic QCMs
              </span>{' '}
              & Study Guides
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">
              Access high-yield lecture summaries, downloadable PDFs, and practice with multiple-choice
              quizzes whose questions and answer options shuffle randomly every single attempt.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/quizzes"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Start Practicing Quizzes
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/resources"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Browse Resources
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
              <Shuffle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Anti-Cheating Randomized QCMs
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every quiz run shuffles question order and option order. Answers stay on the server
              until submission for unbiased, authentic test preparation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Multi-Format Resources
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Download concise PDF cheat sheets, watch curated visual video lectures, and read
              handpicked articles organized by subject and difficulty.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Performance & Detailed Feedback
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive immediate grades with comprehensive explanations for every question, review
              mistakes, and track historical scores in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Subjects Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Disciplines
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a discipline to discover resources and test your knowledge.
            </p>
          </div>
          <Link
            to="/resources"
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            All Subjects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading academic disciplines..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-400 dark:hover:border-primary-500 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700/60">
                      {getSubjectIcon(s.icon)}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {s.level}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                    {s.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {s.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex gap-3">
                    <span>{s.resources_count || 0} Resources</span>
                    <span>•</span>
                    <span>{s.quizzes_count || 0} Quizzes</span>
                  </div>
                  <Link
                    to={`/resources?subject=${s.id}`}
                    className="font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Quizzes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Popular Practice Quizzes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive randomized tests with instant correction.
            </p>
          </div>
          <Link
            to="/quizzes"
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            View All Quizzes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                    {q.subject?.name}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{q.duration_minutes ? `${q.duration_minutes} min` : 'Untimed'}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                  {q.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {q.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {q.questions_count} Questions
                </span>
                <Link
                  to={`/quizzes/${q.id}/take`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
                >
                  Start Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
