import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LifeBuoy,
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  User as UserIcon,
  Shield,
  Headphones,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenNewTicket: () => void;
  onOpenTestRunner: () => void;
  onSelectTicket?: (ticketId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTicket,
  onOpenTestRunner,
  onSelectTicket,
  searchTerm,
  setSearchTerm
}) => {
  const { currentUser, allUsers, switchUser, isAdmin, isAgent, isCustomer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <Headphones className="w-3 h-3" /> Agent
          </span>
        );
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <UserCheck className="w-3 h-3" /> Customer
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs">
      {/* Brand & Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 transform rotate-3 hover:rotate-0 transition-transform font-bold text-lg tracking-tight">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                OmniDesk
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center relative w-72 md:w-96 ml-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search tickets, customers, or articles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-full border-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Automated Tests Button */}
        <button
          id="btn-run-tests"
          onClick={onOpenTestRunner}
          title="Run Automated Tests"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
        >
          <PlayCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="hidden md:inline">Run Tests</span>
        </button>

        {/* New Ticket Action */}
        <button
          id="btn-new-ticket-nav"
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-md shadow-rose-200 dark:shadow-rose-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isCustomer ? 'Submit Request' : 'Create Ticket'}
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.ticketId && onSelectTicket) {
                          onSelectTicket(n.ticketId);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead ? (
                          <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {n.title}
                          </p>
                          <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-neutral-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown (Fast RBAC Switcher) */}
        <div className="relative">
          <button
            id="btn-user-switcher"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 cursor-pointer"
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={currentUser?.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]">
                {currentUser?.name}
              </span>
              <div className="flex items-center gap-1">
                {getRoleBadge(currentUser?.role)}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 font-medium">Switch Active Role / User (RBAC Demo)</p>
              </div>

              <div className="py-1">
                {allUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      currentUser?.id === user.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold' : ''
                    }`}
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getRoleBadge(user.role)}
                        <span className="text-[10px] text-neutral-400 truncate">
                          {user.department || user.title}
                        </span>
                      </div>
                    </div>
                    {currentUser?.id === user.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
