import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { NewTicketModal } from './components/NewTicketModal';
import { CustomerPortal } from './components/CustomerPortal';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { LiveChatWidget } from './components/LiveChatWidget';
import { CannedResponsesManager } from './components/CannedResponsesManager';
import { SLAPoliciesView } from './components/SLAPoliciesView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuditLogsView } from './components/AuditLogsView';
import { TeamManagementView } from './components/TeamManagementView';
import { TestRunnerModal } from './components/TestRunnerModal';
import { Ticket, KnowledgeBaseArticle, TicketCategory } from './types';
import { api } from './lib/api';

const AppContent: React.FC = () => {
  const { currentUser, isCustomer, isAgent, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters
  const [activeView, setActiveView] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [articleDraft, setArticleDraft] = useState<{
    title: string;
    category: TicketCategory;
    content: string;
    tags: string[];
  } | null>(null);

  // Sync default tab with role
  useEffect(() => {
    if (isCustomer) {
      setActiveTab('customer-portal');
    } else {
      setActiveTab('tickets');
    }
  }, [currentUser?.role]);

  const loadData = async () => {
    try {
      const [allTickets, allArticles] = await Promise.all([
        api.getTickets({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          search: globalSearch || undefined,
          view: activeView !== 'all' ? activeView : undefined
        }),
        api.getArticles()
      ]);
      setTickets(allTickets);
      setArticles(allArticles);
    } catch (err) {
      console.error('Failed to load tickets/articles in AppContent:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [statusFilter, priorityFilter, categoryFilter, globalSearch, activeView, currentUser?.id]);

  const openTicketsCount = tickets.filter(t => t.status !== 'solved' && t.status !== 'closed').length;
  const slaBreachCount = tickets.filter(
    t => t.status !== 'solved' && t.status !== 'closed' && (t.sla.isFirstResponseBreached || t.sla.isResolutionBreached)
  ).length;

  const handleOpenTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    if (isCustomer && activeTab !== 'customer-portal') {
      setActiveTab('customer-portal');
    } else if (!isCustomer && activeTab !== 'tickets') {
      setActiveTab('tickets');
    }
  };

  const handleOpenArticleDraft = (draft: { title: string; category: TicketCategory; content: string; tags: string[] }) => {
    setArticleDraft(draft);
    setActiveTab('kb');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        onSelectTicket={handleOpenTicket}
        searchTerm={globalSearch}
        setSearchTerm={setGlobalSearch}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openTicketsCount={openTicketsCount}
          slaBreachCount={slaBreachCount}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex min-h-0 overflow-hidden">
          {activeTab === 'customer-portal' && (
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <CustomerPortal
                tickets={tickets}
                articles={articles}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
                onSelectTicket={handleOpenTicket}
                onSelectArticle={id => {
                  setActiveTab('kb');
                }}
                onOpenChat={() => {
                  setActiveTab('chat');
                }}
              />
              {selectedTicketId && (
                <div className="w-full md:w-[600px] lg:w-[750px] shrink-0 h-full">
                  <TicketDetail
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                    onTicketUpdated={loadData}
                    onOpenArticleModalWithDraft={handleOpenArticleDraft}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="flex-1 flex min-h-0 overflow-hidden">
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={id => setSelectedTicketId(id)}
                activeView={activeView}
                setActiveView={setActiveView}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
              />

              {/* Side-by-side Ticket Workspace */}
              {selectedTicketId && (
                <div className="w-full md:w-[600px] lg:w-[750px] shrink-0 h-full">
                  <TicketDetail
                    ticketId={selectedTicketId}
                    onClose={() => setSelectedTicketId(null)}
                    onTicketUpdated={loadData}
                    onOpenArticleModalWithDraft={handleOpenArticleDraft}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <LiveChatWidget isFullScreenConsole={true} />
          )}

          {activeTab === 'kb' && (
            <KnowledgeBaseView
              initialDraftArticle={articleDraft}
              onClearInitialDraft={() => setArticleDraft(null)}
            />
          )}

          {activeTab === 'macros' && <CannedResponsesManager />}
          {activeTab === 'sla' && <SLAPoliciesView />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'audit' && <AuditLogsView />}
          {activeTab === 'teams' && <TeamManagementView />}
        </main>
      </div>

      {/* Floating Customer Live Chat Widget */}
      {isCustomer && activeTab !== 'chat' && <LiveChatWidget />}

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onTicketCreated={newId => {
          loadData();
          setSelectedTicketId(newId);
          if (isCustomer) {
            setActiveTab('customer-portal');
          } else {
            setActiveTab('tickets');
          }
        }}
      />

      {/* Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
