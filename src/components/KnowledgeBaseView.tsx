import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  CheckCircle2,
  Calendar,
  Sparkles,
  X,
  Share2,
  FileText
} from 'lucide-react';
import { KnowledgeBaseArticle, TicketCategory } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface KnowledgeBaseViewProps {
  initialDraftArticle?: { title: string; category: TicketCategory; content: string; tags: string[] } | null;
  onClearInitialDraft?: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  initialDraftArticle,
  onClearInitialDraft
}) => {
  const { isAgent } = useAuth();

  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [votedMap, setVotedMap] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  // New Article Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('general');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>(['guide']);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadArticles = async () => {
    try {
      const data = await api.getArticles(searchQuery, categoryFilter !== 'all' ? categoryFilter : undefined);
      setArticles(data);
      if (!selectedArticleId && data.length > 0) {
        setSelectedArticleId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load KB articles:', err);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [searchQuery, categoryFilter]);

  // If passed an AI draft from a solved ticket
  useEffect(() => {
    if (initialDraftArticle) {
      setNewTitle(initialDraftArticle.title);
      setNewCategory(initialDraftArticle.category);
      setNewContent(initialDraftArticle.content);
      setNewTags(initialDraftArticle.tags);
      setIsModalOpen(true);
      if (onClearInitialDraft) onClearInitialDraft();
    }
  }, [initialDraftArticle]);

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  const handleVote = async (articleId: string, isHelpful: boolean) => {
    if (votedMap[articleId]) return;
    try {
      await api.voteArticle(articleId, isHelpful);
      setVotedMap(prev => ({ ...prev, [articleId]: isHelpful ? 'helpful' : 'unhelpful' }));
      await loadArticles();
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !newTags.includes(val)) {
        setNewTags([...newTags, val]);
        setTagInput('');
      }
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createArticle({
        title: newTitle,
        category: newCategory,
        content: newContent,
        tags: newTags
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      await loadArticles();
      setSelectedArticleId(created.id);
    } catch (err) {
      console.error('Failed to create article:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 shrink-0 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Knowledge Base & Self-Service Portal
            </h2>
            <p className="text-xs text-neutral-500">
              Verified setup tutorials, developer guides, and troubleshooting procedures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles and keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Create Article Action for Agents */}
            {isAgent && (
              <button
                id="btn-new-article"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Article</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {['all', 'billing', 'technical', 'account', 'general'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Left Articles List & Right Article Reader */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Articles Index */}
        <div className="w-80 md:w-96 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 shrink-0">
          {articles.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No matching knowledge base articles found.
            </div>
          ) : (
            articles.map(article => {
              const isSelected = article.id === selectedArticleId;
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    <span className="text-indigo-600 dark:text-indigo-400">{article.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {article.views}
                      </span>
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <ThumbsUp className="w-3 h-3" /> {article.helpfulCount}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Article Reader */}
        {selectedArticle ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-neutral-900">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Article Header */}
              <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {selectedArticle.category}
                  </span>
                  <span>•</span>
                  <span>Author: {selectedArticle.authorName}</span>
                  <span>•</span>
                  <span>Updated {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
                </div>

                <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {selectedArticle.title}
                </h1>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {selectedArticle.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Article Markdown / Text Content */}
              <div className="text-xs md:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal whitespace-pre-wrap space-y-4">
                {selectedArticle.content}
              </div>

              {/* Was this article helpful? Voting Card */}
              <div className="mt-8 p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Was this article helpful?
                </h4>
                <p className="text-[11px] text-neutral-500 mb-4">
                  Your feedback helps our team improve documentation accuracy.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleVote(selectedArticle.id, true)}
                    disabled={!!votedMap[selectedArticle.id]}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      votedMap[selectedArticle.id] === 'helpful'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Yes ({selectedArticle.helpfulCount})</span>
                  </button>

                  <button
                    onClick={() => handleVote(selectedArticle.id, false)}
                    disabled={!!votedMap[selectedArticle.id]}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      votedMap[selectedArticle.id] === 'unhelpful'
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-red-500'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>No ({selectedArticle.unhelpfulCount})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-neutral-400 text-xs">
            Select an article from the left directory to view full content.
          </div>
        )}
      </div>

      {/* New Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Publish Knowledge Base Article
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., How to configure OAuth SSO with Google Workspace"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="technical">Technical / API</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="account">Account & Security</option>
                    <option value="general">General Guides</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tags (Press Enter to add)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    {newTags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-white dark:bg-neutral-700 text-xs font-semibold">
                        #{t}
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag..."
                      className="bg-transparent p-0.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Article Body (Markdown format supported) *
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder="# Overview&#10;&#10;Explain the problem and step-by-step resolution..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs resize-none"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
