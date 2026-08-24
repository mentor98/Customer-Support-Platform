import React, { useState, useEffect } from 'react';
import { Zap, Plus, Search, Tag, X, CheckCircle2, Code } from 'lucide-react';
import { CannedResponse, TicketCategory } from '../types';
import { api } from '../lib/api';

export const CannedResponsesManager: React.FC = () => {
  const [macros, setMacros] = useState<CannedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Macro form
  const [title, setTitle] = useState('');
  const [shortcut, setShortcut] = useState('/');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['macro']);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMacros = async () => {
    try {
      const data = await api.getMacros(categoryFilter !== 'all' ? categoryFilter : undefined);
      setMacros(data);
    } catch (err) {
      console.error('Failed to load macros:', err);
    }
  };

  useEffect(() => {
    loadMacros();
  }, [categoryFilter]);

  const filteredMacros = macros.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortcut.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createMacro({
        title,
        shortcut: shortcut.startsWith('/') ? shortcut : `/${shortcut}`,
        category,
        content,
        tags
      });
      setIsModalOpen(false);
      setTitle('');
      setShortcut('/');
      setContent('');
      await loadMacros();
    } catch (err) {
      console.error('Failed to create macro:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 shrink-0 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Canned Responses & Agent Macros
            </h2>
            <p className="text-xs text-neutral-500">
              Templated reply snippets with dynamic placeholder variables for faster resolution times.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search macros (/refund, /welcome)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Macro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Macros */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMacros.map(macro => (
            <div
              key={macro.id}
              className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                    {macro.shortcut}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-neutral-400">
                    {macro.category}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {macro.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono bg-neutral-50 dark:bg-neutral-850 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 whitespace-pre-wrap line-clamp-4">
                  {macro.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex gap-1 flex-wrap">
                  {macro.tags.map(t => (
                    <span key={t} className="text-[10px] text-neutral-500">
                      #{t}
                    </span>
                  ))}
                </div>
                <span>Used {macro.usageCount} times</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Macro Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Create New Canned Response Macro
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Macro Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Billing Refund Confirmation"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Shortcut Syntax *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/refund"
                    value={shortcut}
                    onChange={e => setShortcut(e.target.value)}
                    className="w-full p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TicketCategory)}
                    className="w-full p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    Template Content *
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Use {'{{customer.name}}'}, {'{{ticket.id}}'}
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  placeholder="Hi {{customer.name}}, we have processed your refund for ticket #{{ticket.id}}."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Save Macro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
