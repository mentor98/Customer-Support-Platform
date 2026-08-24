import React, { useState } from 'react';
import {
  Search,
  Plus,
  LifeBuoy,
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Shield,
  Star,
  ExternalLink
} from 'lucide-react';
import { Ticket, KnowledgeBaseArticle } from '../types';
import { useAuth } from '../context/AuthContext';

interface CustomerPortalProps {
  tickets: Ticket[];
  articles: KnowledgeBaseArticle[];
  onOpenNewTicket: () => void;
  onSelectTicket: (ticketId: string) => void;
  onSelectArticle: (articleId: string) => void;
  onOpenChat: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  tickets,
  articles,
  onOpenNewTicket,
  onSelectTicket,
  onSelectArticle,
  onOpenChat
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const myTickets = tickets.filter(t => t.customerId === currentUser?.id);
  const openCount = myTickets.filter(t => t.status !== 'solved' && t.status !== 'closed').length;
  const solvedCount = myTickets.filter(t => t.status === 'solved' || t.status === 'closed').length;

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-6 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section with Search */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-4 text-white">
              <LifeBuoy className="w-3.5 h-3.5" /> Customer Help Center
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {currentUser?.name || 'Customer'}. How can we assist you?
            </h1>
            <p className="text-sm text-indigo-100 mt-2">
              Browse our technical guides, check active ticket progress, or reach out to our dedicated support engineering team.
            </p>

            {/* Instant KB Search */}
            <div className="relative mt-6">
              <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search troubleshooting guides, setup docs, billing questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-neutral-900 placeholder-neutral-400 shadow-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={onOpenNewTicket}
            className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Submit a Request
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Create a support ticket with diagnostic logs and screenshots for our engineering team.
            </p>
          </div>

          <div
            onClick={onOpenChat}
            className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Live Support Chat
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Connect with an active support specialist for instant real-time resolution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Active Requests
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              You have <span className="font-bold text-neutral-900 dark:text-neutral-100">{openCount}</span> open ticket{openCount === 1 ? '' : 's'} and <span className="font-bold text-neutral-900 dark:text-neutral-100">{solvedCount}</span> resolved.
            </p>
          </div>
        </div>

        {/* My Requests Section */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                My Support Requests ({myTickets.length})
              </h2>
              <p className="text-xs text-neutral-500">
                Track updates, add replies, and view agent notes on your tickets.
              </p>
            </div>
            <button
              onClick={onOpenNewTicket}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          </div>

          {myTickets.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              You haven't submitted any tickets yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {myTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-neutral-400">
                        #{ticket.ticketNumber}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {ticket.status}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                        {ticket.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ticket.subject}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="text-[11px] text-neutral-400">
                      Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Knowledge Base Guides */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Knowledge Base & Self-Service Guides
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            Explore verified solutions for setup, webhook debugging, billing, and SSO authentication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article.id)}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-neutral-50/50 dark:bg-neutral-850/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                    {article.category}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1 line-clamp-2">
                    {article.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span>{article.views} views</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {article.helpfulCount} found helpful
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
