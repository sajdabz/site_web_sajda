import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import {
  BookOpen,
  Search,
  Filter,
  FileText,
  Video,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  Tag
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Resources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/subjects');
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedSubject) params.subject_id = selectedSubject;
        if (selectedType) params.resource_type = selectedType;
        if (selectedLevel) params.level = selectedLevel;
        if (search.trim()) params.search = search.trim();

        const res = await api.get('/resources', { params });
        setResources(res.data);
      } catch (err) {
        console.error("Failed to load resources:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResources, 250);
    return () => clearTimeout(timer);
  }, [selectedSubject, selectedType, selectedLevel, search]);

  const handleDownload = async (resource) => {
    try {
      if (resource.resource_type === 'pdf' && resource.file_path) {
        const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/resources/${resource.id}/download`;
        window.open(downloadUrl, '_blank');
      } else if (resource.external_url) {
        // Also trigger download endpoint to increment counter
        api.get(`/resources/${resource.id}/download`).catch(() => {});
        window.open(resource.external_url, '_blank', 'noopener,noreferrer');
      }
      // Update local download count
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, downloads_count: r.downloads_count + 1 } : r))
      );
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <FileText className="w-3 h-3" /> PDF Document
          </span>
        );
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
            <Video className="w-3 h-3" /> Video Lecture
          </span>
        );
      case 'article':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            <ExternalLink className="w-3 h-3" /> Article / Guide
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Curated Knowledge Base
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Resources & Documents
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse downloadable PDFs, summaries, and verified course materials across all levels.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, formula, or concept..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSearchParams(e.target.value ? { subject: e.target.value } : {});
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Media Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="video">Video Lectures</option>
              <option value="article">Web Articles & Guides</option>
            </select>
          </div>
        </div>

        {/* Quick subject pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-400">Quick Subject Filter:</span>
          <button
            onClick={() => {
              setSelectedSubject('');
              setSearchParams({});
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              selectedSubject === ''
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                const nextVal = selectedSubject === String(s.id) ? '' : String(s.id);
                setSelectedSubject(nextVal);
                setSearchParams(nextVal ? { subject: nextVal } : {});
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                selectedSubject === String(s.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Fetching resources..." />
      ) : resources.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No resources found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Try adjusting your search query or subject filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all hover:border-primary-400 dark:hover:border-primary-500"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getTypeBadge(item.resource_type)}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.subject?.name || 'General'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Download className="w-3.5 h-3.5" />
                  <span>{item.downloads_count} views</span>
                </div>

                <button
                  onClick={() => handleDownload(item)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
                >
                  {item.resource_type === 'pdf' ? (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  ) : item.resource_type === 'video' ? (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Video</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Read Guide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
