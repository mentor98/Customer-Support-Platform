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
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            NEW
          </span>
        );
      case 'open':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            OPEN
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            PENDING
          </span>
        );
      case 'on_hold':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300">
            ON HOLD
          </span>
        );
      case 'solved':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            SOLVED
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
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
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/60">
            <AlertCircle className="w-3 h-3" /> URGENT
          </span>
        );
      case 'high':
        return (
          <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-850 px-2 py-0.5 rounded">
            LOW
          </span>
        );
    }
  };

  const renderSLATimer = (ticket: Ticket) => {
    if (ticket.status === 'solved' || ticket.status === 'closed') {
      return (
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Met
        </span>
      );
    }

    const isBreached = ticket.sla.isFirstResponseBreached || ticket.sla.isResolutionBreached;
    if (isBreached) {
      return (
        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
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

    return (
      <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-500" />
        <span>{timeStr} ({label})</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 overflow-hidden">
      {/* Top View Selector & Filter Toolbar */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 shrink-0 transition-colors">
        {/* Custom Views Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {views.map(v => (
            <button
              key={v.id}
              id={`view-tab-${v.id}`}
              onClick={() => setActiveView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeView === v.id
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Filter Dropdowns & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Status Select */}
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
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
              className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
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
              className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="billing">Billing & Invoices</option>
              <option value="technical">Technical / API</option>
              <option value="account">Account & SSO</option>
              <option value="feature_request">Feature Request</option>
              <option value="general">General Support</option>
            </select>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Showing <span className="font-bold text-neutral-900 dark:text-neutral-100">{tickets.length}</span> tickets
          </div>
        </div>
      </div>

      {/* Ticket List Table / Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 text-center border border-neutral-200 dark:border-neutral-800 my-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              No tickets found in this view
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              You're all caught up! There are no matching customer support tickets for the selected filters.
            </p>
            <button
              onClick={onOpenNewTicket}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
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
                className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border transition-all cursor-pointer relative hover:shadow-md ${
                  isSelected
                    ? 'border-indigo-600 ring-1 ring-indigo-600 dark:border-indigo-500 dark:ring-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left Metadata & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        #{ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 uppercase tracking-wider">
                        {ticket.category.replace('_', ' ')}
                      </span>
                      {ticket.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center gap-0.5"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {ticket.subject}
                    </h4>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
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
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                      />
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                        {ticket.customerName}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Messages and Updated Timestamp */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/70 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span>{ticket.messageCount} {ticket.messageCount === 1 ? 'message' : 'messages'}</span>
                    {ticket.csat && (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
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
