import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                EduLearn Platform
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Empowering students with structured study resources, lecture summaries, and adaptive
              randomized QCM quizzes for mastery and exam success.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Built with FastAPI, React, and Tailwind CSS</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/resources" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Study Resources
                </Link>
              </li>
              <li>
                <Link to="/quizzes" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Practice Quizzes (QCM)
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400">
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Disciplines
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>Mathematics & Calculus</li>
              <li>Classical Physics</li>
              <li>Computer Science & Algorithms</li>
              <li>Software Engineering</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} EduLearn. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Production-quality education system designed for students.
          </p>
        </div>
      </div>
    </footer>
  );
}
