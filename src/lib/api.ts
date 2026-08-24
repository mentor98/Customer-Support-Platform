import {
  User,
  Ticket,
  TicketMessage,
  KnowledgeBaseArticle,
  CannedResponse,
  SLAPolicy,
  AuditLog,
  ChatSession,
  NotificationItem,
  AnalyticsSummary,
  TestCaseResult,
  TicketPriority,
  TicketCategory
} from '../types';

export const api = {
  // Auth & Users
  getMe: async (): Promise<{ user: User; allUsers: User[] }> => {
    const res = await fetch('/api/auth/me');
    return res.json();
  },
  switchUser: async (userId: string): Promise<{ success: boolean; user: User }> => {
    const res = await fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },
  registerCustomer: async (name: string, email: string, department?: string): Promise<{ user: User }> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, department })
    });
    return res.json();
  },
  getUsers: async (role?: string): Promise<User[]> => {
    const url = role ? `/api/users?role=${role}` : '/api/users';
    const res = await fetch(url);
    return res.json();
  },
  getTeams: async (): Promise<any[]> => {
    const res = await fetch('/api/teams');
    return res.json();
  },

  // Tickets
  getTickets: async (filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedAgentId?: string;
    search?: string;
    view?: string;
  }): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.assignedAgentId) params.append('assignedAgentId', filters.assignedAgentId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.view) params.append('view', filters.view);

    const res = await fetch(`/api/tickets?${params.toString()}`);
    return res.json();
  },
  getTicket: async (id: string): Promise<Ticket> => {
    const res = await fetch(`/api/tickets/${id}`);
    return res.json();
  },
  createTicket: async (payload: {
    subject: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
    channel?: 'portal' | 'email' | 'chat' | 'api';
    tags?: string[];
    assignedTeamId?: string;
    assignedAgentId?: string;
    customerId?: string;
    customFields?: Record<string, string>;
    attachments?: { name: string; size: number; type: string; url: string }[];
  }): Promise<Ticket> => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  updateTicket: async (id: string, updates: Partial<Ticket>): Promise<Ticket> => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Ticket Messages
  getMessages: async (ticketId: string): Promise<TicketMessage[]> => {
    const res = await fetch(`/api/tickets/${ticketId}/messages`);
    return res.json();
  },
  addMessage: async (ticketId: string, payload: {
    content: string;
    isInternal: boolean;
    attachments?: { name: string; size: number; type: string; url: string }[];
  }): Promise<TicketMessage> => {
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  submitCSAT: async (ticketId: string, rating: 1 | 2 | 3 | 4 | 5, comment?: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/tickets/${ticketId}/csat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    return res.json();
  },

  // AI Copilot
  aiSummarize: async (ticketId: string): Promise<{ summary: string }> => {
    const res = await fetch(`/api/tickets/${ticketId}/ai/summarize`, { method: 'POST' });
    return res.json();
  },
  aiSuggestReply: async (ticketId: string, tone: 'professional' | 'empathetic' | 'technical' | 'concise'): Promise<{ reply: string }> => {
    const res = await fetch(`/api/tickets/${ticketId}/ai/suggest-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone })
    });
    return res.json();
  },
  aiAnalyzeSentiment: async (subject: string, description: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'frustrated' | 'urgent';
    suggestedPriority: TicketPriority;
    suggestedTags: string[];
    keyPainPoint: string;
  }> => {
    const res = await fetch('/api/ai/analyze-sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, description })
    });
    return res.json();
  },
  aiGenerateKBArticle: async (ticketId: string): Promise<{
    title: string;
    category: string;
    tags: string[];
    content: string;
  }> => {
    const res = await fetch('/api/articles/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });
    return res.json();
  },

  // Knowledge Base
  getArticles: async (search?: string, category?: string): Promise<KnowledgeBaseArticle[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const res = await fetch(`/api/articles?${params.toString()}`);
    return res.json();
  },
  getArticle: async (id: string): Promise<KnowledgeBaseArticle> => {
    const res = await fetch(`/api/articles/${id}`);
    return res.json();
  },
  createArticle: async (payload: { title: string; category: TicketCategory; content: string; tags: string[] }): Promise<KnowledgeBaseArticle> => {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  voteArticle: async (id: string, isHelpful: boolean): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/articles/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHelpful })
    });
    return res.json();
  },

  // Macros
  getMacros: async (category?: string): Promise<CannedResponse[]> => {
    const url = category ? `/api/macros?category=${category}` : '/api/macros';
    const res = await fetch(url);
    return res.json();
  },
  createMacro: async (payload: { title: string; shortcut: string; category: TicketCategory; content: string; tags: string[] }): Promise<CannedResponse> => {
    const res = await fetch('/api/macros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  applyMacro: async (macroId: string, ticketId: string): Promise<{ content: string }> => {
    const res = await fetch('/api/macros/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroId, ticketId })
    });
    return res.json();
  },

  // SLA Policies
  getSLAPolicies: async (): Promise<SLAPolicy[]> => {
    const res = await fetch('/api/sla/policies');
    return res.json();
  },
  updateSLAPolicy: async (id: string, updates: Partial<SLAPolicy>): Promise<SLAPolicy> => {
    const res = await fetch(`/api/sla/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Live Chat
  getChatSession: async (): Promise<ChatSession> => {
    const res = await fetch('/api/chats/session');
    return res.json();
  },
  getAllChats: async (): Promise<ChatSession[]> => {
    const res = await fetch('/api/chats');
    return res.json();
  },
  sendChatMessage: async (sessionId: string, message: string): Promise<ChatSession> => {
    const res = await fetch(`/api/chats/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    return res.json();
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await fetch('/api/notifications');
    return res.json();
  },
  markNotificationRead: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },
  markAllNotificationsRead: async (): Promise<{ success: boolean }> => {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/audit-logs');
    return res.json();
  },

  // Analytics
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await fetch('/api/analytics');
    return res.json();
  },

  // Automated Tests
  runAutomatedTests: async (): Promise<{
    summary: { total: number; passed: number; failed: number; success: boolean; executedAt: string };
    results: TestCaseResult[];
  }> => {
    const res = await fetch('/api/tests/run', { method: 'POST' });
    return res.json();
  }
};
