import React from 'react';
import {
  Inbox,
  MessageSquare,
  BookOpen,
  Zap,
  Clock,
  BarChart3,
  ShieldCheck,
  Users,
  PlayCircle,
  HelpCircle,
  FolderLock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'tickets'
  | 'chat'
  | 'kb'
  | 'macros'
  | 'sla'
  | 'analytics'
  | 'audit'
  | 'teams'
  | 'customer-portal'
  | 'tests';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openTicketsCount: number;
  slaBreachCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openTicketsCount,
  slaBreachCount
}) => {
  const { currentUser, isAdmin, isAgent, isCustomer } = useAuth();

  const agentMenuItems = [
    {
      id: 'tickets' as ActiveTab,
      label: 'Ticket Inbox',
      icon: Inbox,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
    },
    {
      id: 'chat' as ActiveTab,
      label: 'Live Chat Console',
      icon: MessageSquare
    },
    {
      id: 'kb' as ActiveTab,
      label: 'Knowledge Base',
      icon: BookOpen
    },
    {
      id: 'macros' as ActiveTab,
      label: 'Canned Responses',
      icon: Zap
    },
    {
      id: 'sla' as ActiveTab,
      label: 'SLA Monitoring',
      icon: Clock,
      badge: slaBreachCount > 0 ? `${slaBreachCount} Breached` : undefined,
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics & CSAT',
      icon: BarChart3
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit Trail',
      icon: ShieldCheck
    }
  ];

  const adminOnlyItems = [
    {
      id: 'teams' as ActiveTab,
      label: 'Teams & Routing',
      icon: Users
    }
  ];

  const customerMenuItems = [
    {
      id: 'customer-portal' as ActiveTab,
      label: 'My Support Requests',
      icon: Inbox,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined
    },
    {
      id: 'kb' as ActiveTab,
      label: 'Help Center & KB',
      icon: BookOpen
    },
    {
      id: 'chat' as ActiveTab,
      label: 'Live Support Chat',
      icon: MessageSquare
    }
  ];

  return (
    <aside className="w-64 bg-indigo-600 dark:bg-slate-900 border-r border-indigo-700 dark:border-slate-800 text-white flex flex-col justify-between shrink-0 transition-colors h-[calc(100vh-5rem)] sticky top-20 shadow-sm">
      <div className="p-3 space-y-6 overflow-y-auto">
        {/* Navigation Sections */}
        {isCustomer ? (
          <div>
            <div className="px-3 py-1.5 text-[10px] font-black text-indigo-200 dark:text-slate-500 uppercase tracking-widest">
              Customer Portal
            </div>
            <div className="space-y-1 mt-1">
              {customerMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-md dark:bg-indigo-600 dark:text-white'
                        : 'text-indigo-100 hover:text-white hover:bg-indigo-500/30 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-indigo-200 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="px-3 py-1.5 text-[10px] font-black text-indigo-200 dark:text-slate-500 uppercase tracking-widest">
                Support Operations
              </div>
              <div className="space-y-1 mt-1">
                {agentMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-indigo-600 shadow-md dark:bg-indigo-600 dark:text-white'
                          : 'text-indigo-100 hover:text-white hover:bg-indigo-500/30 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-indigo-200 dark:text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-black text-indigo-200 dark:text-slate-500 uppercase tracking-widest">
                  Administration
                </div>
                <div className="space-y-1 mt-1">
                  {adminOnlyItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`sidebar-tab-${item.id}`}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-indigo-600 shadow-md dark:bg-indigo-600 dark:text-white'
                            : 'text-indigo-100 hover:text-white hover:bg-indigo-500/30 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-indigo-200 dark:text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer info & quick tip */}
      <div className="p-3 border-t border-indigo-500/30 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-indigo-700/60 dark:bg-slate-800/80 border border-indigo-500/30 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Copilot Active</span>
          </div>
          <p className="text-[11px] text-indigo-100 dark:text-slate-400 leading-relaxed">
            Gemini 3.7 Flash assistance for instant summaries, empathetic drafts, and auto-tagging.
          </p>
        </div>
      </div>
    </aside>
  );
};
