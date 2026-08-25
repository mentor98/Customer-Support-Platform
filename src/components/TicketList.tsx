import React, { useState } from 'react';
import {
  Filter,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  User as UserIcon,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  onOpenNewTicket: () => void;
  isLoading?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  activeView,
  setActiveView,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  onOpenNewTicket,
  isLoading
}) => {
  const { currentUser, isAgent } = useAuth();
  const [sortBy, setSortBy] = useState<'updated' | 'sla' | 'priority'>('updated');

  const views = [
    { id: 'all', label: 'All Tickets' },
    { id: 'my-open', label: 'My Open' },
    { id: 'unassigned', label: 'Unassigned Queue' },
    { id: 'urgent', label: 'Urgent Priority' },
    { id: 'sla-breached', label: 'SLA Breaches' },
    { id: 'solved', label: 'Recently Solved' }
  ];

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
            NEW
          </span>
        );
      case 'open':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
            OPEN
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
            PENDING
          </span>
        );
      case 'on_hold':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            ON HOLD
          </span>
        );
      case 'solved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
            SOLVED
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            CLOSED
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 text-[11px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60 shadow-xs">
            <AlertCircle className="w-3 h-3" /> URGENT
          </span>
        );
      case 'high':
        return (
          <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/40">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/50 px-2.5 py-0.5 rounded-full">
            LOW
          </span>
        );
    }
  };

  const renderSLATimer = (ticket: Ticket) => {
    if (ticket.status === 'solved' || ticket.status === 'closed') {
      return (
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> Met
        </span>
      );
    }

    const isBreached = ticket.sla.isFirstResponseBreached || ticket.sla.isResolutionBreached;
    if (isBreached) {
      return (
        <span className="text-[11px] font-black text-rose-700 dark:text-rose-400 flex items-center gap-1 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3" /> SLA Breached
        </span>
      );
    }

    const remaining = !ticket.sla.firstResponseMet
      ? ticket.sla.firstResponseRemainingMinutes
      : ticket.sla.resolutionRemainingMinutes;

    const label = !ticket.sla.firstResponseMet ? '1st Resp' : 'Resolution';

    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    const isUrgent = remaining < 60;

    return (
      <span
        className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
          isUrgent
            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}
      >
        <Clock className="w-3 h-3 text-amber-500" />
        <span>{timeStr} ({label})</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden">
      {/* Top View Selector & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 transition-colors">
        {/* Custom Views Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {views.map(v => (
            <button
              key={v.id}
              id={`view-tab-${v.id}`}
              onClick={() => setActiveView(v.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeView === v.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Status Select */}
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="on_hold">On Hold</option>
              <option value="solved">Solved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Select */}
            <select
              id="filter-priority-select"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category Select */}
            <select
              id="filter-category-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing & Invoices</option>
              <option value="technical">Technical / API</option>
              <option value="account">Account & SSO</option>
              <option value="feature_request">Feature Request</option>
              <option value="general">General Support</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            Showing <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{tickets.length}</span> tickets
          </div>
        </div>
      </div>

      {/* Ticket List Table / Grid */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 my-8 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No tickets found in this view
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You're all caught up! There are no matching customer support tickets for the selected filters.
            </p>
            <button
              onClick={onOpenNewTicket}
              className="mt-5 px-5 py-2.5 text-xs font-bold rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-rose-950/40 transition-all cursor-pointer"
            >
              Create New Ticket
            </button>
          </div>
        ) : (
          tickets.map(ticket => {
            const isSelected = ticket.id === selectedTicketId;
            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                onClick={() => onSelectTicket(ticket.id)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all cursor-pointer relative hover:shadow-lg ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 dark:border-indigo-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Metadata & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        #{ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-wider">
                        {ticket.category.replace('_', ' ')}
                      </span>
                      {ticket.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {ticket.subject}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {ticket.lastMessagePreview || ticket.description}
                    </p>
                  </div>

                  {/* Right Status & Assignee */}
                  <div className="flex flex-col items-end gap-2 shrink-0 text-right">
                    <div className="flex items-center gap-2">
                      {renderSLATimer(ticket)}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={ticket.customerAvatar}
                        alt={ticket.customerName}
                        title={`Customer: ${ticket.customerName} (${ticket.customerEmail})`}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        {ticket.customerName}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Messages and Updated Timestamp */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{ticket.messageCount} {ticket.messageCount === 1 ? 'message' : 'messages'}</span>
                    {ticket.csat && (
                      <span className="text-amber-500 font-bold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                        ★ {ticket.csat.rating}/5 CSAT
                      </span>
                    )}
                  </div>
                  <div>
                    Updated {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
