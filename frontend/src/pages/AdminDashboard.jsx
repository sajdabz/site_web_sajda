import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  ShieldCheck,
  Users,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Search,
  Check,
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'subjects', 'resources', 'quizzes', 'import', 'users'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Entities
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modals state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '', level: 'Undergraduate', icon: 'book', color: 'blue' });

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', resource_type: 'pdf', subject_id: '', external_url: '' });
  const [resourceFile, setResourceFile] = useState(null);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', subject_id: '', duration_minutes: 15, passing_score_percentage: 50, pick_random_count: '', is_published: true });

  // Question modal
  const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    text: '',
    explanation: '',
    question_type: 'single',
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });

  // Bulk Import state
  const [importQuizId, setImportQuizId] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [importCsvFile, setImportCsvFile] = useState(null);
  const [importMessage, setImportMessage] = useState({ text: '', type: '' });

  const refreshData = async () => {
    try {
      const [stRes, subRes, resRes, qzRes, usrRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/subjects'),
        api.get('/resources'),
        api.get('/admin/quizzes'),
        api.get('/admin/users')
      ]);
      setStats(stRes.data);
      setSubjects(subRes.data);
      setResources(resRes.data);
      setQuizzes(qzRes.data);
      setUsersList(usrRes.data);
      if (qzRes.data.length > 0 && !importQuizId) {
        setImportQuizId(String(qzRes.data[0].id));
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Subject Actions ---
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, subjectForm);
      } else {
        await api.post('/subjects', subjectForm);
      }
      setSubjectModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? All associated resources and quizzes will be deleted.')) return;
    try {
      await api.delete(`/subjects/${id}`);
      refreshData();
    } catch (err) {
      alert('Failed to delete subject.');
    }
  };

  // --- Resource Actions ---
  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', resourceForm.title);
      if (resourceForm.description) formData.append('description', resourceForm.description);
      formData.append('resource_type', resourceForm.resource_type);
      formData.append('subject_id', resourceForm.subject_id);
      if (resourceForm.external_url) formData.append('external_url', resourceForm.external_url);
      if (resourceFile) formData.append('file', resourceFile);

      await api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResourceModalOpen(false);
      setResourceFile(null);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save resource.');
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await api.delete(`/resources/${id}`);
      refreshData();
    } catch (err) {
      alert('Failed to delete resource.');
    }
  };

  // --- Quiz Actions ---
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...quizForm,
        subject_id: parseInt(quizForm.subject_id),
        duration_minutes: quizForm.duration_minutes ? parseInt(quizForm.duration_minutes) : null,
        passing_score_percentage: parseInt(quizForm.passing_score_percentage),
        pick_random_count: quizForm.pick_random_count ? parseInt(quizForm.pick_random_count) : null
      };

      if (editingQuiz) {
        await api.put(`/admin/quizzes/${editingQuiz.id}`, payload);
      } else {
        await api.post('/admin/quizzes', payload);
      }
      setQuizModalOpen(false);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save quiz.');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz and all its questions permanently?')) return;
    try {
      await api.delete(`/admin/quizzes/${id}`);
      refreshData();
    } catch (err) {
      alert('Failed to delete quiz.');
    }
  };

  // --- Question Actions ---
  const handleOpenQuestions = async (quiz) => {
    try {
      const res = await api.get(`/admin/quizzes/${quiz.id}`);
      setSelectedQuizForQuestions(res.data);
    } catch (err) {
      alert('Failed to fetch quiz questions');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuizForQuestions) return;

    // Validate options
    const validOptions = questionForm.options.filter((o) => o.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('Question must contain at least 2 options.');
      return;
    }
    const hasCorrect = validOptions.some((o) => o.is_correct);
    if (!hasCorrect) {
      alert('At least one option must be marked as correct.');
      return;
    }

    try {
      await api.post(`/admin/quizzes/${selectedQuizForQuestions.id}/questions`, {
        text: questionForm.text,
        explanation: questionForm.explanation,
        question_type: questionForm.question_type,
        options: validOptions
      });
      setQuestionModalOpen(false);
      setQuestionForm({
        text: '',
        explanation: '',
        question_type: 'single',
        options: [
          { text: '', is_correct: true },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      });
      handleOpenQuestions(selectedQuizForQuestions);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${qId}`);
      handleOpenQuestions(selectedQuizForQuestions);
      refreshData();
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  // --- Bulk Import ---
  const handleBulkImportJson = async () => {
    if (!importQuizId) {
      alert('Please select a target quiz');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText);
      const res = await api.post(`/admin/quizzes/${importQuizId}/bulk-import-json`, parsed);
      setImportMessage({ text: res.data.message, type: 'success' });
      setImportJsonText('');
      refreshData();
    } catch (err) {
      setImportMessage({ text: err.response?.data?.detail || 'Invalid JSON format or network error.', type: 'error' });
    }
  };

  const handleBulkImportCsv = async () => {
    if (!importQuizId || !importCsvFile) {
      alert('Please select a quiz and a CSV file.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', importCsvFile);
      const res = await api.post(`/admin/quizzes/${importQuizId}/bulk-import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportMessage({ text: res.data.message, type: 'success' });
      setImportCsvFile(null);
      refreshData();
    } catch (err) {
      setImportMessage({ text: err.response?.data?.detail || 'Failed to import CSV.', type: 'error' });
    }
  };

  // --- User Promotion ---
  const handleToggleUserRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Change ${user.username}'s role to ${nextRole}?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/role?role=${nextRole}`);
      refreshData();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner message="Loading Admin Workspace..." size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator Control Panel
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Platform Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage disciplines, upload course materials, configure QCM quizzes, and monitor analytics.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: TrendingUp },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'resources', label: 'Resources', icon: FileText },
          { id: 'quizzes', label: 'Quizzes & Questions', icon: HelpCircle },
          { id: 'import', label: 'Bulk Import', icon: Upload },
          { id: 'users', label: 'Users', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedQuizForQuestions(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_users}</h3>
              <p className="text-xs text-slate-500 mt-1">{stats?.total_students} Students • {stats?.total_admins} Admins</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disciplines</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_subjects}</h3>
              <p className="text-xs text-slate-500 mt-1">Across all academic levels</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resources</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_resources}</h3>
              <p className="text-xs text-slate-500 mt-1">PDFs, videos & articles</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Quiz Attempts</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats?.total_attempts}</h3>
              <p className="text-xs text-slate-500 mt-1">Avg Score: {stats?.average_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subjects Management */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Subjects</h3>
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectForm({ name: '', code: '', description: '', level: 'Undergraduate', icon: 'book', color: 'blue' });
                setSubjectModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Resources</th>
                  <th className="py-3 px-4">Quizzes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{s.code}</td>
                    <td className="py-3 px-4 text-slate-500">{s.level}</td>
                    <td className="py-3 px-4 text-slate-500">{s.resources_count}</td>
                    <td className="py-3 px-4 text-slate-500">{s.quizzes_count}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingSubject(s);
                          setSubjectForm({
                            name: s.name,
                            code: s.code,
                            description: s.description || '',
                            level: s.level,
                            icon: s.icon,
                            color: s.color
                          });
                          setSubjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(s.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Resources Management */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Uploaded Resources</h3>
            <button
              onClick={() => {
                setEditingResource(null);
                setResourceForm({
                  title: '',
                  description: '',
                  resource_type: 'pdf',
                  subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
                  external_url: ''
                });
                setResourceFile(null);
                setResourceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Downloads</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                    <td className="py-3 px-4 uppercase text-xs font-bold text-slate-500">{r.resource_type}</td>
                    <td className="py-3 px-4 text-slate-500">{r.subject?.name}</td>
                    <td className="py-3 px-4 text-slate-500">{r.downloads_count}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteResource(r.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Quizzes and Questions */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {!selectedQuizForQuestions ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quizzes Catalog</h3>
                <button
                  onClick={() => {
                    setEditingQuiz(null);
                    setQuizForm({
                      title: '',
                      description: '',
                      subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
                      duration_minutes: 15,
                      passing_score_percentage: 50,
                      pick_random_count: '',
                      is_published: true
                    });
                    setQuizModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create New Quiz
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950 text-primary-600">
                          {quiz.subject?.name}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${quiz.is_published ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{quiz.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{quiz.description}</p>
                      <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                        <span>{quiz.questions?.length || 0} Questions</span>
                        <span>•</span>
                        <span>{quiz.duration_minutes ? `${quiz.duration_minutes} min` : 'Untimed'}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenQuestions(quiz)}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                      >
                        Manage Questions ({quiz.questions?.length || 0}) <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingQuiz(quiz);
                            setQuizForm({
                              title: quiz.title,
                              description: quiz.description || '',
                              subject_id: String(quiz.subject_id),
                              duration_minutes: quiz.duration_minutes || '',
                              passing_score_percentage: quiz.passing_score_percentage,
                              pick_random_count: quiz.pick_random_count || '',
                              is_published: quiz.is_published
                            });
                            setQuizModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Quiz Questions Detail view
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setSelectedQuizForQuestions(null)}
                    className="text-xs font-semibold text-primary-600 hover:underline mb-1"
                  >
                    ← Back to All Quizzes
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Questions: {selectedQuizForQuestions.title}
                  </h3>
                </div>

                <button
                  onClick={() => setQuestionModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              <div className="space-y-4">
                {selectedQuizForQuestions.questions?.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Question {idx + 1}</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{q.text}</h4>
                        {q.explanation && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      {q.options?.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            opt.is_correct
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>{opt.text}</span>
                          {opt.is_correct && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Bulk Import */}
      {activeTab === 'import' && (
        <div className="max-w-3xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Question Import</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add tens of questions simultaneously into any quiz via JSON format or CSV spreadsheet.
            </p>
          </div>

          {importMessage.text && (
            <div
              className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                importMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {importMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{importMessage.text}</span>
            </div>
          )}

          {/* Select Target Quiz */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Target Quiz</label>
            <select
              value={importQuizId}
              onChange={(e) => setImportQuizId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.subject?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* Method A: JSON Import */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <h4 className="font-bold text-slate-900 dark:text-white">Method 1: Paste JSON</h4>
              </div>
              <textarea
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[
  {
    "text": "What is 2 + 2?",
    "explanation": "Basic addition",
    "question_type": "single",
    "options": [
      {"text": "4", "is_correct": true},
      {"text": "5", "is_correct": false}
    ]
  }
]'
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
              />
              <button
                onClick={handleBulkImportJson}
                disabled={!importJsonText.trim()}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                Import from JSON
              </button>
            </div>

            {/* Method B: CSV Upload */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-slate-900 dark:text-white">Method 2: Upload CSV</h4>
              </div>
              <p className="text-xs text-slate-500">
                Columns: question, question_type, explanation, option1, is_correct1, option2, is_correct2...
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportCsvFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
              />
              <button
                onClick={handleBulkImportCsv}
                disabled={!importCsvFile}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                Upload and Import CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registered Accounts</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-700 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{u.username}</td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUserRole(u)}
                        className="text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Change to {u.role === 'admin' ? 'Student' : 'Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {/* 1. Subject Modal */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject Name</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              placeholder="e.g. Mathematics"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Code</label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                placeholder="MATH"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Level</label>
              <input
                type="text"
                value={subjectForm.level}
                onChange={(e) => setSubjectForm({ ...subjectForm, level: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                placeholder="Undergraduate"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
            <textarea
              rows={3}
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Resource Modal */}
      <Modal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title="Add Learning Resource"
      >
        <form onSubmit={handleSaveResource} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Resource Title</label>
            <input
              type="text"
              required
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject</label>
              <select
                value={resourceForm.subject_id}
                onChange={(e) => setResourceForm({ ...resourceForm, subject_id: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
              <select
                value={resourceForm.resource_type}
                onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="pdf">PDF Document</option>
                <option value="video">Video Lecture</option>
                <option value="article">Web Article / Guide</option>
              </select>
            </div>
          </div>
          {resourceForm.resource_type === 'pdf' ? (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Upload PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setResourceFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">External URL</label>
              <input
                type="url"
                value={resourceForm.external_url}
                onChange={(e) => setResourceForm({ ...resourceForm, external_url: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                placeholder="https://..."
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
            <textarea
              rows={3}
              value={resourceForm.description}
              onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResourceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
            >
              Save Resource
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Quiz Modal */}
      <Modal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        title={editingQuiz ? 'Edit Quiz Settings' : 'Create New Quiz'}
      >
        <form onSubmit={handleSaveQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Quiz Title</label>
            <input
              type="text"
              required
              value={quizForm.title}
              onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject</label>
            <select
              value={quizForm.subject_id}
              onChange={(e) => setQuizForm({ ...quizForm, subject_id: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Duration (min)</label>
              <input
                type="number"
                value={quizForm.duration_minutes}
                onChange={(e) => setQuizForm({ ...quizForm, duration_minutes: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pass Score (%)</label>
              <input
                type="number"
                value={quizForm.passing_score_percentage}
                onChange={(e) => setQuizForm({ ...quizForm, passing_score_percentage: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Pick N Random</label>
              <input
                type="number"
                placeholder="All"
                value={quizForm.pick_random_count}
                onChange={(e) => setQuizForm({ ...quizForm, pick_random_count: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
            <textarea
              rows={2}
              value={quizForm.description}
              onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={quizForm.is_published}
              onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="is_published" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Publish Quiz to Students
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuizModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
            >
              Save Quiz
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Question Modal */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title="Add Question to Quiz"
      >
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Question Prompt</label>
            <textarea
              rows={2}
              required
              value={questionForm.text}
              onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              placeholder="What is the derivative of..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Question Type</label>
              <select
                value={questionForm.question_type}
                onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
              >
                <option value="single">Single Choice (Radio)</option>
                <option value="multiple">Multiple Choices (Checkbox)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
              Options (2 to 4 options, check all that are correct)
            </label>
            <div className="space-y-2">
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={opt.is_correct}
                    onChange={(e) => {
                      const newOpts = [...questionForm.options];
                      if (questionForm.question_type === 'single') {
                        newOpts.forEach((o, i) => (o.is_correct = i === idx));
                      } else {
                        newOpts[idx].is_correct = e.target.checked;
                      }
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                    className="w-4 h-4 text-emerald-600 rounded"
                    title="Check if this option is correct"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...questionForm.options];
                      newOpts[idx].text = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOpts });
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Explanation (Optional)</label>
            <textarea
              rows={2}
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              placeholder="Why this answer is correct..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuestionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Question
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
