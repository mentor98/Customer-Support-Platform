import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Paperclip,
  Tag,
  AlertCircle,
  HelpCircle,
  Upload
} from 'lucide-react';
import { TicketPriority, TicketCategory, User } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (newTicketId: string) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onTicketCreated
}) => {
  const { currentUser, allUsers, isAgent, isCustomer } = useAuth();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['web']);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiTriaging, setIsAiTriaging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const customers = allUsers.filter(u => u.role === 'customer');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            url: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAiAutoTriage = async () => {
    if (!subject || !description) return;
    setIsAiTriaging(true);
    try {
      const analysis = await api.aiAnalyzeSentiment(subject, description);
      setPriority(analysis.suggestedPriority);
      if (analysis.suggestedTags && analysis.suggestedTags.length > 0) {
        setTags(prev => Array.from(new Set([...prev, ...analysis.suggestedTags])));
      }
    } catch (err) {
      console.error('AI Triage error:', err);
    } finally {
      setIsAiTriaging(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const newTicket = await api.createTicket({
        subject,
        description,
        priority,
        category,
        channel: 'portal',
        customerId: isCustomer ? currentUser?.id : (selectedCustomerId || customers[0]?.id),
        tags,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      onTicketCreated(newTicket.id);
      onClose();
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/40">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isCustomer ? 'Submit a Support Request' : 'Create New Customer Ticket'}
            </h3>
            <p className="text-xs text-neutral-500">
              Fill in the issue details to route directly to the designated support team.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Customer Selection (Agent view only) */}
          {!isCustomer && (
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Requester Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500 font-medium"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Subject / Issue Summary *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Cannot connect to REST API webhook endpoint"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                Detailed Description & Error Logs *
              </label>
              {subject && description && (
                <button
                  type="button"
                  onClick={handleAiAutoTriage}
                  disabled={isAiTriaging}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiTriaging ? 'Analyzing...' : 'AI Auto-Detect Priority & Tags'}</span>
                </button>
              )}
            </div>
            <textarea
              required
              rows={5}
              placeholder="Please provide steps to reproduce, environment information, and any error messages..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TicketCategory)}
                className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="general">General Support</option>
                <option value="technical">Technical / API / Bugs</option>
                <option value="billing">Billing & Subscriptions</option>
                <option value="account">Account & SSO Security</option>
                <option value="feature_request">Feature Request</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TicketPriority)}
                className="w-full p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="low">Low (Routine Inquiry)</option>
                <option value="medium">Medium (Standard Request)</option>
                <option value="high">High (Major Feature Impaired)</option>
                <option value="urgent">Urgent (Production Critical / Outage)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Tags (Press Enter to add)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-neutral-400 hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag..."
                className="bg-transparent text-xs p-1 focus:outline-none text-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Attachments (Screenshots, Logs, Receipts)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center cursor-pointer"
            >
              <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
              <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                Click or drag & drop files to attach
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                PNG, JPG, PDF, TXT, LOG up to 25MB
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !description.trim()}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Ticket...' : 'Create Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
