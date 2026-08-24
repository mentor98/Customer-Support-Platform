import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Lock,
  MessageSquare,
  Sparkles,
  Paperclip,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Shield,
  Tag,
  Zap,
  BookOpen,
  Star,
  FileText,
  Copy,
  ChevronDown,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  File
} from 'lucide-react';
import {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  CannedResponse,
  AuditLog
} from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
  onTicketUpdated: () => void;
  onOpenArticleModalWithDraft?: (draft: { title: string; category: TicketCategory; content: string; tags: string[] }) => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketId,
  onClose,
  onTicketUpdated,
  onOpenArticleModalWithDraft
}) => {
  const { currentUser, allUsers, isAgent, isAdmin, isCustomer } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [macros, setMacros] = useState<CannedResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activeTab, setActiveTab] = useState<'conversation' | 'ai-copilot' | 'audit-sla'>('conversation');
  const [replyType, setReplyType] = useState<'public' | 'internal'>('public');
  const [replyText, setReplyText] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Copilot state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'empathetic' | 'technical' | 'concise'>('professional');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [aiSentiment, setAiSentiment] = useState<{
    sentiment: string;
    suggestedPriority: TicketPriority;
    suggestedTags: string[];
    keyPainPoint: string;
  } | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [isGeneratingKB, setIsGeneratingKB] = useState(false);

  // CSAT Rating state
  const [csatRating, setCsatRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [csatComment, setCsatComment] = useState('');
  const [isSubmittingCsat, setIsSubmittingCsat] = useState(false);
  const [csatSuccess, setCsatSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTicketData = async () => {
    try {
      const [tkt, msgs, macs, logs] = await Promise.all([
        api.getTicket(ticketId),
        api.getMessages(ticketId),
        api.getMacros(),
        api.getAuditLogs()
      ]);
      setTicket(tkt);
      setMessages(msgs);
      setMacros(macs);
      setAuditLogs(logs.filter(l => l.ticketId === ticketId));
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateProperty = async (field: keyof Ticket, value: any) => {
    if (!ticket) return;
    try {
      const updated = await api.updateTicket(ticket.id, { [field]: value });
      setTicket(updated);
      onTicketUpdated();
      loadTicketData();
    } catch (err) {
      console.error('Failed to update ticket property:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      await api.addMessage(ticketId, {
        content: replyText,
        isInternal: replyType === 'internal',
        attachments: attachments.length > 0 ? attachments : undefined
      });
      setReplyText('');
      setAttachments([]);
      await loadTicketData();
      onTicketUpdated();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleApplyMacro = async (macroId: string) => {
    try {
      const res = await api.applyMacro(macroId, ticketId);
      setReplyText(prev => (prev ? `${prev}\n\n${res.content}` : res.content));
    } catch (err) {
      console.error('Failed to apply macro:', err);
    }
  };

  const handleAiSummarize = async () => {
    setIsAiSummarizing(true);
    try {
      const res = await api.aiSummarize(ticketId);
      setAiSummary(res.summary);
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setIsAiSummarizing(false);
    }
  };

  const handleAiSmartReply = async () => {
    setIsGeneratingReply(true);
    try {
      const res = await api.aiSuggestReply(ticketId, aiTone);
      setReplyText(res.reply);
      setReplyType('public');
    } catch (err) {
      console.error('AI smart reply error:', err);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleAiSentiment = async () => {
    if (!ticket) return;
    setIsAnalyzingSentiment(true);
    try {
      const res = await api.aiAnalyzeSentiment(ticket.subject, ticket.description);
      setAiSentiment(res);
    } catch (err) {
      console.error('AI sentiment error:', err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const handleAiGenerateKB = async () => {
    setIsGeneratingKB(true);
    try {
      const articleDraft = await api.aiGenerateKBArticle(ticketId);
      if (onOpenArticleModalWithDraft) {
        onOpenArticleModalWithDraft({
          title: articleDraft.title,
          category: (articleDraft.category as TicketCategory) || ticket?.category || 'general',
          content: articleDraft.content,
          tags: articleDraft.tags
        });
      }
    } catch (err) {
      console.error('Failed to generate KB draft:', err);
    } finally {
      setIsGeneratingKB(false);
    }
  };

  const handleCSATSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCsat(true);
    try {
      await api.submitCSAT(ticketId, csatRating, csatComment);
      setCsatSuccess(true);
      await loadTicketData();
      onTicketUpdated();
    } catch (err) {
      console.error('Failed to submit CSAT:', err);
    } finally {
      setIsSubmittingCsat(false);
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-500 bg-white dark:bg-neutral-900">
        Loading ticket #{ticketId}...
      </div>
    );
  }

  const agents = allUsers.filter(u => u.role === 'agent' || u.role === 'admin');

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
      {/* Top Header & Property Controls Bar */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
              #{ticket.ticketNumber}
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {ticket.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Property Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-medium">Status:</span>
              <select
                id="ticket-status-select"
                value={ticket.status}
                disabled={isCustomer}
                onChange={e => handleUpdateProperty('status', e.target.value as TicketStatus)}
                className="text-xs font-bold rounded-lg px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="on_hold">On Hold</option>
                <option value="solved">Solved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-medium">Priority:</span>
              <select
                id="ticket-priority-select"
                value={ticket.priority}
                disabled={isCustomer}
                onChange={e => handleUpdateProperty('priority', e.target.value as TicketPriority)}
                className="text-xs font-semibold rounded-lg px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee Selector (Agents/Admin only) */}
            {isAgent && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-400 font-medium">Assignee:</span>
                <select
                  id="ticket-assignee-select"
                  value={ticket.assignedAgentId || ''}
                  onChange={e => handleUpdateProperty('assignedAgentId', e.target.value || undefined)}
                  className="text-xs font-medium rounded-lg px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.title || 'Agent'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SLA Tracker Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">SLA:</span>
            {ticket.status === 'solved' || ticket.status === 'closed' ? (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" /> Met
              </span>
            ) : ticket.sla.isFirstResponseBreached || ticket.sla.isResolutionBreached ? (
              <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-3.5 h-3.5" /> Breached
              </span>
            ) : (
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {!ticket.sla.firstResponseMet
                  ? `${ticket.sla.firstResponseRemainingMinutes}m left for 1st response`
                  : `${ticket.sla.resolutionRemainingMinutes}m left for resolution`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Layout: Main Thread + Right Customer Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Left / Center Work Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-neutral-900">
          {/* Work Tabs */}
          <div className="flex items-center gap-4 px-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900">
            <button
              id="ticket-tab-conversation"
              onClick={() => setActiveTab('conversation')}
              className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'conversation'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation ({messages.length})
            </button>

            {isAgent && (
              <button
                id="ticket-tab-ai"
                onClick={() => setActiveTab('ai-copilot')}
                className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ai-copilot'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI Copilot & Summarizer
              </button>
            )}

            <button
              id="ticket-tab-audit"
              onClick={() => setActiveTab('audit-sla')}
              className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit-sla'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              SLA & Audit Log ({auditLogs.length})
            </button>
          </div>

          {/* TAB 1: CONVERSATION THREAD */}
          {activeTab === 'conversation' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map(msg => {
                  const isInternal = msg.isInternal;
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isInternal
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                          : 'bg-neutral-50/60 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={msg.authorAvatar}
                            alt={msg.authorName}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                {msg.authorName}
                              </span>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                {msg.authorRole}
                              </span>
                              {isInternal && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> INTERNAL NOTE (Private)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] text-neutral-400">
                          {new Date(msg.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap pl-9 font-normal">
                        {msg.content}
                      </div>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pl-9 flex flex-wrap gap-2">
                          {msg.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.url}
                              download={att.name}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{att.name}</span>
                              <span className="text-[10px] text-neutral-400">
                                ({Math.round(att.size / 1024)} KB)
                              </span>
                              <Download className="w-3 h-3 text-neutral-400 ml-1" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Composer */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                {/* Reply Mode Tabs (Agent only) */}
                {isAgent && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyType('public')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          replyType === 'public'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        Public Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyType('internal')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          replyType === 'internal'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Internal Note
                      </button>
                    </div>

                    {/* Macro Shortcut Applicator */}
                    <div className="flex items-center gap-2">
                      <select
                        id="macro-select"
                        onChange={e => {
                          if (e.target.value) handleApplyMacro(e.target.value);
                          e.target.value = '';
                        }}
                        className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
                      >
                        <option value="">⚡ Apply Canned Macro...</option>
                        {macros.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.shortcut} - {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage}>
                  <div
                    className={`rounded-xl border transition-all ${
                      replyType === 'internal'
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-850'
                    }`}
                  >
                    <textarea
                      id="ticket-reply-textarea"
                      rows={4}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={
                        replyType === 'internal'
                          ? 'Add a private note for other support agents...'
                          : 'Write a public reply to the customer...'
                      }
                      className="w-full p-3 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none"
                    />

                    {/* Pending Attachments preview */}
                    {attachments.length > 0 && (
                      <div className="px-3 pb-2 flex flex-wrap gap-2">
                        {attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-neutral-800 rounded text-xs border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                          >
                            <Paperclip className="w-3 h-3 text-neutral-400" />
                            <span className="truncate max-w-[140px]">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-neutral-400 hover:text-red-500 ml-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          id="btn-add-attachment"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach files (logs, screenshots, documents)"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="hidden sm:inline">Attach</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        id="btn-send-reply"
                        disabled={isSubmitting || (!replyText.trim() && attachments.length === 0)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                          replyType === 'internal'
                            ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
                            : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{replyType === 'internal' ? 'Add Private Note' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: AI COPILOT & SUMMARIZER */}
          {activeTab === 'ai-copilot' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Thread Summarizer Card */}
              <div className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-neutral-900 dark:to-purple-950/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Ticket Thread Auto-Summarizer
                    </h3>
                  </div>
                  <button
                    id="btn-ai-summarize"
                    onClick={handleAiSummarize}
                    disabled={isAiSummarizing}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiSummarizing ? 'Summarizing...' : 'Summarize Thread'}</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  Uses Gemini AI to extract key issue symptoms, root causes, past agent actions, and current pending requirements into a concise executive summary.
                </p>

                {aiSummary ? (
                  <div className="p-4 bg-white dark:bg-neutral-850 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                    {aiSummary}
                  </div>
                ) : (
                  <div className="p-4 bg-white/70 dark:bg-neutral-850/50 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-xs text-neutral-400">
                    Click "Summarize Thread" to generate an AI briefing for this ticket.
                  </div>
                )}
              </div>

              {/* Smart Reply Draft Generator */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Smart Reply Draft Generator
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-neutral-500 font-medium">Desired Tone:</span>
                  {(['professional', 'empathetic', 'technical', 'concise'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                        aiTone === t
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}

                  <button
                    id="btn-ai-generate-reply"
                    onClick={handleAiSmartReply}
                    disabled={isGeneratingReply}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingReply ? 'Generating...' : 'Insert Draft into Composer'}</span>
                  </button>
                </div>
              </div>

              {/* Sentiment & Urgency Analyzer */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-500" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Sentiment & Auto-Triage Detector
                    </h3>
                  </div>
                  <button
                    id="btn-ai-sentiment"
                    onClick={handleAiSentiment}
                    disabled={isAnalyzingSentiment}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAnalyzingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}</span>
                  </button>
                </div>

                {aiSentiment && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Detected Sentiment</span>
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 capitalize mt-1">
                        {aiSentiment.sentiment}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Suggested Priority</span>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mt-1">
                        {aiSentiment.suggestedPriority}
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Suggested Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiSentiment.suggestedTags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Turn Ticket into KB Article */}
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      Create Knowledge Base Article from Solution
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Convert this ticket's troubleshooting dialogue into a clean public help center guide with one click.
                    </p>
                  </div>
                  <button
                    id="btn-ai-generate-kb"
                    onClick={handleAiGenerateKB}
                    disabled={isGeneratingKB}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isGeneratingKB ? 'Generating KB...' : 'Generate KB Article'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SLA & AUDIT HISTORY */}
          {activeTab === 'audit-sla' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SLA Targets Breakdown */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  SLA Service Level Performance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">First Response SLA</span>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {ticket.sla.firstResponseMet ? 'Response Delivered' : 'Pending Response'}
                      </span>
                      {ticket.sla.firstResponseMet ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Met
                        </span>
                      ) : ticket.sla.isFirstResponseBreached ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Breached
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          {ticket.sla.firstResponseRemainingMinutes}m left
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Resolution SLA</span>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {ticket.status === 'solved' || ticket.status === 'closed' ? 'Resolved' : 'Active'}
                      </span>
                      {ticket.status === 'solved' || ticket.status === 'closed' ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Met
                        </span>
                      ) : ticket.sla.isResolutionBreached ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Breached
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          {ticket.sla.resolutionRemainingMinutes}m left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Timeline */}
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neutral-500" />
                  Audit Trail & Compliance Log
                </h3>

                <div className="space-y-3">
                  {auditLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {log.actorName} ({log.actorRole.toUpperCase()})
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                        [{log.action}] {log.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Customer Profile & Ticket Metadata */}
        <div className="w-72 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 p-4 space-y-5 overflow-y-auto hidden lg:block shrink-0">
          {/* Customer Profile Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
              Requester Info
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={ticket.customerAvatar}
                alt={ticket.customerName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-neutral-700"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {ticket.customerName}
                </p>
                <p className="text-[11px] text-neutral-500 truncate">
                  {ticket.customerEmail}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between text-neutral-500">
                <span>Channel:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 uppercase">
                  {ticket.channel}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Created:</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Custom Fields */}
          {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Custom Metadata
              </h4>
              <div className="space-y-2">
                {Object.entries(ticket.customFields).map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <span className="text-neutral-400 font-medium">{key}:</span>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CSAT Customer Rating Card */}
          {ticket.status === 'solved' && (
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Customer Satisfaction (CSAT)
              </h4>

              {ticket.csat ? (
                <div className="text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                    {'★'.repeat(ticket.csat.rating)}
                    {'☆'.repeat(5 - ticket.csat.rating)}
                    <span className="text-neutral-700 dark:text-neutral-300 font-semibold ml-1">
                      ({ticket.csat.rating}/5)
                    </span>
                  </div>
                  {ticket.csat.comment && (
                    <p className="text-neutral-600 dark:text-neutral-400 italic">
                      "{ticket.csat.comment}"
                    </p>
                  )}
                </div>
              ) : isCustomer ? (
                <form onSubmit={handleCSATSubmit} className="space-y-2.5">
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                    How satisfied are you with the resolution of this ticket?
                  </p>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as const).map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCsatRating(num)}
                        className="text-lg p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <span className={csatRating >= num ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-700'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Optional feedback comment..."
                    value={csatComment}
                    onChange={e => setCsatComment(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingCsat}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {isSubmittingCsat ? 'Submitting...' : 'Submit CSAT Rating'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-neutral-500">
                  CSAT survey sent to customer. Awaiting feedback response.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
