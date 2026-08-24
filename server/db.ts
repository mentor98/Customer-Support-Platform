import {
  User,
  Team,
  Ticket,
  TicketMessage,
  KnowledgeBaseArticle,
  CannedResponse,
  SLAPolicy,
  AuditLog,
  ChatSession,
  NotificationItem,
  AnalyticsSummary,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  SLAStatus,
  UserRole
} from '../src/types';
import {
  INITIAL_USERS,
  INITIAL_TEAMS,
  INITIAL_TICKETS,
  INITIAL_MESSAGES,
  INITIAL_KB_ARTICLES,
  INITIAL_CANNED_RESPONSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAT_SESSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SLA_POLICIES
} from './data';

class DatabaseStore {
  public users: User[] = [...INITIAL_USERS];
  public teams: Team[] = [...INITIAL_TEAMS];
  public tickets: Ticket[] = [...INITIAL_TICKETS];
  public messages: TicketMessage[] = [...INITIAL_MESSAGES];
  public kbArticles: KnowledgeBaseArticle[] = [...INITIAL_KB_ARTICLES];
  public macros: CannedResponse[] = [...INITIAL_CANNED_RESPONSES];
  public slaPolicies: SLAPolicy[] = [...INITIAL_SLA_POLICIES];
  public auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  public chatSessions: ChatSession[] = [...INITIAL_CHAT_SESSIONS];
  public notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

  private nextTicketNumber = 1005;

  constructor() {
    this.refreshAllSLAs();
  }

  // --- SLA ENGINE ---
  public calculateSLAForPriority(priority: TicketPriority, createdAt: string = new Date().toISOString()): SLAStatus {
    const policy = this.slaPolicies.find(p => p.priority === priority) || {
      priority,
      firstResponseMinutes: 60,
      resolutionMinutes: 480,
      businessHoursOnly: true
    };

    const createdTime = new Date(createdAt).getTime();
    const firstDeadline = new Date(createdTime + policy.firstResponseMinutes * 60000).toISOString();
    const resDeadline = new Date(createdTime + policy.resolutionMinutes * 60000).toISOString();
    const nowTime = Date.now();

    const firstRemaining = Math.max(0, Math.round((new Date(firstDeadline).getTime() - nowTime) / 60000));
    const resRemaining = Math.max(0, Math.round((new Date(resDeadline).getTime() - nowTime) / 60000));

    return {
      firstResponseDeadline: firstDeadline,
      firstResponseMet: false,
      resolutionDeadline: resDeadline,
      resolutionMet: false,
      isFirstResponseBreached: nowTime > new Date(firstDeadline).getTime(),
      isResolutionBreached: nowTime > new Date(resDeadline).getTime(),
      firstResponseRemainingMinutes: firstRemaining,
      resolutionRemainingMinutes: resRemaining
    };
  }

  public refreshAllSLAs() {
    const now = Date.now();
    for (const t of this.tickets) {
      if (t.status === 'solved' || t.status === 'closed') {
        continue;
      }
      const firstDead = new Date(t.sla.firstResponseDeadline).getTime();
      const resDead = new Date(t.sla.resolutionDeadline).getTime();

      if (!t.sla.firstResponseMet) {
        t.sla.isFirstResponseBreached = now > firstDead;
        t.sla.firstResponseRemainingMinutes = Math.max(0, Math.round((firstDead - now) / 60000));
      }

      if (!t.sla.resolutionMet) {
        t.sla.isResolutionBreached = now > resDead;
        t.sla.resolutionRemainingMinutes = Math.max(0, Math.round((resDead - now) / 60000));
      }
    }
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // --- NOTIFICATIONS ---
  public addNotification(notif: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>) {
    const item: NotificationItem = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(item);
    return item;
  }

  // --- TICKETS ---
  public getTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedAgentId?: string;
    customerId?: string;
    search?: string;
    view?: string; // 'my-open', 'unassigned', 'urgent', 'solved'
  }): Ticket[] {
    this.refreshAllSLAs();
    let result = [...this.tickets];

    if (!filters) return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (filters.view) {
      switch (filters.view) {
        case 'my-open':
          if (filters.assignedAgentId) {
            result = result.filter(t => t.assignedAgentId === filters.assignedAgentId && t.status !== 'solved' && t.status !== 'closed');
          }
          break;
        case 'unassigned':
          result = result.filter(t => !t.assignedAgentId && t.status !== 'solved' && t.status !== 'closed');
          break;
        case 'urgent':
          result = result.filter(t => t.priority === 'urgent' && t.status !== 'solved' && t.status !== 'closed');
          break;
        case 'sla-breached':
          result = result.filter(t => (t.sla.isFirstResponseBreached || t.sla.isResolutionBreached) && t.status !== 'solved' && t.status !== 'closed');
          break;
        case 'solved':
          result = result.filter(t => t.status === 'solved' || t.status === 'closed');
          break;
      }
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.assignedAgentId && !filters.view) {
      result = result.filter(t => t.assignedAgentId === filters.assignedAgentId);
    }
    if (filters.customerId) {
      result = result.filter(t => t.customerId === filters.customerId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.ticketNumber.toString().includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getTicketById(id: string): Ticket | undefined {
    this.refreshAllSLAs();
    return this.tickets.find(t => t.id === id);
  }

  public createTicket(payload: {
    subject: string;
    description: string;
    priority: TicketPriority;
    category: TicketCategory;
    customerId: string;
    channel?: 'portal' | 'email' | 'chat' | 'api';
    tags?: string[];
    assignedTeamId?: string;
    assignedAgentId?: string;
    customFields?: Record<string, string>;
    attachments?: { name: string; size: number; type: string; url: string }[];
  }, actor: User): Ticket {
    const customer = this.users.find(u => u.id === payload.customerId) || actor;
    const nowIso = new Date().toISOString();
    const sla = this.calculateSLAForPriority(payload.priority, nowIso);

    const ticketNumber = this.nextTicketNumber++;
    const ticketId = 'tkt-' + ticketNumber;

    const newTicket: Ticket = {
      id: ticketId,
      ticketNumber,
      subject: payload.subject,
      description: payload.description,
      status: 'new',
      priority: payload.priority,
      category: payload.category,
      channel: payload.channel || 'portal',
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAvatar: customer.avatarUrl,
      assignedAgentId: payload.assignedAgentId,
      assignedTeamId: payload.assignedTeamId || 'team-tier1',
      tags: payload.tags || ['inbound'],
      sla,
      createdAt: nowIso,
      updatedAt: nowIso,
      messageCount: 1,
      lastMessagePreview: payload.description.slice(0, 100),
      lastMessageAt: nowIso,
      customFields: payload.customFields
    };

    this.tickets.unshift(newTicket);

    // Add first message
    const firstMsg: TicketMessage = {
      id: 'msg-' + Date.now(),
      ticketId: newTicket.id,
      authorId: customer.id,
      authorName: customer.name,
      authorRole: customer.role,
      authorAvatar: customer.avatarUrl,
      content: payload.description,
      isInternal: false,
      createdAt: nowIso,
      attachments: payload.attachments?.map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        ...att
      }))
    };
    this.messages.push(firstMsg);

    // Audit log
    this.addAuditLog({
      ticketId: newTicket.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TICKET_CREATED',
      details: `Ticket #${newTicket.ticketNumber} "${newTicket.subject}" created with ${newTicket.priority} priority`
    });

    // Notify Tier 1 agents & assigned agent
    for (const user of this.users.filter(u => u.role === 'admin' || u.role === 'agent')) {
      if (user.id !== actor.id) {
        this.addNotification({
          userId: user.id,
          title: `New Ticket #${newTicket.ticketNumber}`,
          message: `${customer.name}: "${newTicket.subject}" (${newTicket.priority.toUpperCase()})`,
          type: 'ticket_created',
          ticketId: newTicket.id
        });
      }
    }

    return newTicket;
  }

  public updateTicket(id: string, updates: Partial<Ticket>, actor: User): Ticket | undefined {
    const ticketIndex = this.tickets.findIndex(t => t.id === id);
    if (ticketIndex === -1) return undefined;

    const oldTicket = this.tickets[ticketIndex];
    const nowIso = new Date().toISOString();

    // Check status transitions
    let solvedAt = oldTicket.solvedAt;
    let closedAt = oldTicket.closedAt;

    if (updates.status && updates.status !== oldTicket.status) {
      if (updates.status === 'solved') {
        solvedAt = nowIso;
        oldTicket.sla.resolutionMet = true;
        oldTicket.sla.resolvedAt = nowIso;
      } else if (updates.status === 'closed') {
        closedAt = nowIso;
        oldTicket.sla.resolutionMet = true;
      }

      this.addAuditLog({
        ticketId: oldTicket.id,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'STATUS_CHANGED',
        details: `Status changed from ${oldTicket.status.toUpperCase()} to ${updates.status.toUpperCase()}`,
        previousValue: oldTicket.status,
        newValue: updates.status
      });

      // Notify customer of status change
      if (oldTicket.customerId !== actor.id) {
        this.addNotification({
          userId: oldTicket.customerId,
          title: `Ticket #${oldTicket.ticketNumber} Updated`,
          message: `Your ticket status was changed to ${updates.status.toUpperCase()}`,
          type: 'ticket_reply',
          ticketId: oldTicket.id
        });
      }
    }

    // Check Priority Change
    if (updates.priority && updates.priority !== oldTicket.priority) {
      this.addAuditLog({
        ticketId: oldTicket.id,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'PRIORITY_CHANGED',
        details: `Priority changed from ${oldTicket.priority} to ${updates.priority}`,
        previousValue: oldTicket.priority,
        newValue: updates.priority
      });
      // Recalculate SLA deadlines
      oldTicket.sla = this.calculateSLAForPriority(updates.priority, oldTicket.createdAt);
    }

    // Check Assignee Change
    if (updates.assignedAgentId !== undefined && updates.assignedAgentId !== oldTicket.assignedAgentId) {
      const assignedUser = this.users.find(u => u.id === updates.assignedAgentId);
      const oldUser = this.users.find(u => u.id === oldTicket.assignedAgentId);

      this.addAuditLog({
        ticketId: oldTicket.id,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'TICKET_ASSIGNED',
        details: `Assigned to ${assignedUser ? assignedUser.name : 'Unassigned'}`,
        previousValue: oldUser ? oldUser.name : 'Unassigned',
        newValue: assignedUser ? assignedUser.name : 'Unassigned'
      });

      if (assignedUser && assignedUser.id !== actor.id) {
        this.addNotification({
          userId: assignedUser.id,
          title: `Assigned to Ticket #${oldTicket.ticketNumber}`,
          message: `You were assigned to "${oldTicket.subject}"`,
          type: 'ticket_assigned',
          ticketId: oldTicket.id
        });
      }
    }

    // Apply updates
    const updatedTicket: Ticket = {
      ...oldTicket,
      ...updates,
      solvedAt,
      closedAt,
      updatedAt: nowIso
    };

    this.tickets[ticketIndex] = updatedTicket;
    return updatedTicket;
  }

  public addMessage(ticketId: string, payload: {
    content: string;
    isInternal: boolean;
    attachments?: { name: string; size: number; type: string; url: string }[];
  }, actor: User): TicketMessage | undefined {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return undefined;

    const nowIso = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: 'msg-' + Date.now(),
      ticketId,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      authorAvatar: actor.avatarUrl,
      content: payload.content,
      isInternal: payload.isInternal,
      createdAt: nowIso,
      attachments: payload.attachments?.map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        ...att
      }))
    };

    this.messages.push(newMsg);

    // Update ticket metadata
    ticket.messageCount = this.messages.filter(m => m.ticketId === ticketId).length;
    ticket.lastMessagePreview = payload.content.slice(0, 100);
    ticket.lastMessageAt = nowIso;
    ticket.updatedAt = nowIso;

    // Handle SLA first response if agent replying publicly for the first time
    if (!payload.isInternal && (actor.role === 'agent' || actor.role === 'admin')) {
      if (!ticket.sla.firstResponseMet) {
        ticket.sla.firstResponseMet = true;
        ticket.sla.firstResponseAt = nowIso;
        const target = new Date(ticket.sla.firstResponseDeadline).getTime();
        ticket.sla.isFirstResponseBreached = Date.now() > target;
      }
      if (ticket.status === 'new') {
        ticket.status = 'open';
      }
    } else if (!payload.isInternal && actor.role === 'customer') {
      if (ticket.status === 'solved') {
        ticket.status = 'open'; // Reopen ticket
      }
    }

    // Audit log
    this.addAuditLog({
      ticketId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: payload.isInternal ? 'INTERNAL_NOTE_ADDED' : 'CUSTOMER_REPLY_ADDED',
      details: payload.isInternal ? 'Added an internal note' : 'Replied to customer'
    });

    // Notify other party
    if (!payload.isInternal) {
      if (actor.role === 'customer') {
        if (ticket.assignedAgentId) {
          this.addNotification({
            userId: ticket.assignedAgentId,
            title: `Reply on Ticket #${ticket.ticketNumber}`,
            message: `${actor.name}: "${payload.content.slice(0, 60)}..."`,
            type: 'ticket_reply',
            ticketId: ticket.id
          });
        }
      } else {
        this.addNotification({
          userId: ticket.customerId,
          title: `Support update on Ticket #${ticket.ticketNumber}`,
          message: `${actor.name}: "${payload.content.slice(0, 60)}..."`,
          type: 'ticket_reply',
          ticketId: ticket.id
        });
      }
    }

    return newMsg;
  }

  public getMessagesForTicket(ticketId: string, userRole: UserRole): TicketMessage[] {
    const msgs = this.messages.filter(m => m.ticketId === ticketId);
    if (userRole === 'customer') {
      // Filter out internal notes for customer security
      return msgs.filter(m => !m.isInternal);
    }
    return msgs;
  }

  public submitCSAT(ticketId: string, rating: 1 | 2 | 3 | 4 | 5, comment: string | undefined, actor: User): boolean {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) return false;

    const csat = {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
      ratedBy: actor.id
    };
    ticket.csat = csat;
    ticket.updatedAt = new Date().toISOString();

    this.addAuditLog({
      ticketId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CSAT_SUBMITTED',
      details: `Customer rated support experience ${rating}/5 stars: "${comment || 'No comment'}"`
    });

    if (ticket.assignedAgentId) {
      this.addNotification({
        userId: ticket.assignedAgentId,
        title: `CSAT Rating: ${rating}/5 Stars!`,
        message: `${actor.name} rated Ticket #${ticket.ticketNumber}`,
        type: 'csat_received',
        ticketId: ticket.id
      });
    }

    return true;
  }

  // --- KNOWLEDGE BASE ---
  public getKBArticles(search?: string, category?: string): KnowledgeBaseArticle[] {
    let result = this.kbArticles.filter(a => a.isPublished);

    if (category && category !== 'all') {
      result = result.filter(a => a.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => b.helpfulCount - a.helpfulCount);
  }

  public voteKBArticle(id: string, isHelpful: boolean): boolean {
    const article = this.kbArticles.find(a => a.id === id);
    if (!article) return false;
    if (isHelpful) {
      article.helpfulCount += 1;
    } else {
      article.notHelpfulCount += 1;
    }
    return true;
  }

  public recordKBView(id: string): void {
    const article = this.kbArticles.find(a => a.id === id);
    if (article) {
      article.views += 1;
    }
  }

  public createKBArticle(payload: Omit<KnowledgeBaseArticle, 'id' | 'slug' | 'helpfulCount' | 'notHelpfulCount' | 'views' | 'createdAt' | 'updatedAt'>, actor: User): KnowledgeBaseArticle {
    const newArt: KnowledgeBaseArticle = {
      ...payload,
      id: 'kb-' + Date.now(),
      slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      helpfulCount: 0,
      notHelpfulCount: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.kbArticles.unshift(newArt);

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'KB_ARTICLE_CREATED',
      details: `Created article "${newArt.title}" in category ${newArt.category}`
    });

    return newArt;
  }

  // --- CANNED RESPONSES / MACROS ---
  public getMacros(category?: string): CannedResponse[] {
    if (category && category !== 'all') {
      return this.macros.filter(m => m.category === category);
    }
    return this.macros;
  }

  public createMacro(payload: Omit<CannedResponse, 'id'>, actor: User): CannedResponse {
    const newMacro: CannedResponse = {
      ...payload,
      id: 'macro-' + Date.now(),
      createdBy: actor.id
    };
    this.macros.push(newMacro);
    return newMacro;
  }

  public interpolateMacro(macroContent: string, ticket: Ticket, agent: User): string {
    return macroContent
      .replace(/{{customer_name}}/g, ticket.customerName)
      .replace(/{{customer_email}}/g, ticket.customerEmail)
      .replace(/{{ticket_id}}/g, ticket.ticketNumber.toString())
      .replace(/{{ticket_subject}}/g, ticket.subject)
      .replace(/{{agent_name}}/g, agent.name)
      .replace(/{{sla_time}}/g, ticket.priority === 'urgent' ? '15 minutes' : '2 hours');
  }

  // --- LIVE CHAT ---
  public getOrCreateChatSession(customer: User): ChatSession {
    let session = this.chatSessions.find(s => s.customerId === customer.id && s.status !== 'ended');
    if (!session) {
      session = {
        id: 'chat-sess-' + Date.now(),
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        agentId: 'usr-agent-1',
        agentName: 'Marcus Vance',
        status: 'active',
        startedAt: new Date().toISOString(),
        messages: [
          {
            id: 'cmsg-auto-welcome',
            sessionId: 'chat-sess-' + Date.now(),
            senderId: 'usr-agent-1',
            senderName: 'Marcus Vance (Support)',
            senderRole: 'agent',
            message: `Hello ${customer.name}! How can we assist you with OmniDesk today?`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      this.chatSessions.unshift(session);
    }
    return session;
  }

  public sendChatMessage(sessionId: string, sender: User, message: string): ChatSession | undefined {
    const session = this.chatSessions.find(s => s.id === sessionId);
    if (!session) return undefined;

    const newMsg = {
      id: 'cmsg-' + Date.now(),
      sessionId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      message,
      timestamp: new Date().toISOString()
    };
    session.messages.push(newMsg);

    // If customer sent message and no agent assigned yet, assign first online agent
    if (sender.role === 'customer' && !session.agentId) {
      const onlineAgent = this.users.find(u => (u.role === 'agent' || u.role === 'admin') && u.isOnline);
      if (onlineAgent) {
        session.agentId = onlineAgent.id;
        session.agentName = onlineAgent.name;
      }
    }

    return session;
  }

  // --- ANALYTICS ---
  public getAnalytics(): AnalyticsSummary {
    this.refreshAllSLAs();
    const total = this.tickets.length;
    const open = this.tickets.filter(t => t.status === 'open' || t.status === 'new').length;
    const pending = this.tickets.filter(t => t.status === 'pending' || t.status === 'on_hold').length;
    const solved = this.tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;

    const breachedCount = this.tickets.filter(t => t.sla.isFirstResponseBreached || t.sla.isResolutionBreached).length;
    const complianceRate = total > 0 ? Number((((total - breachedCount) / total) * 100).toFixed(1)) : 100;

    // CSAT calculation
    const ratedTickets = this.tickets.filter(t => t.csat !== undefined);
    const avgCsat = ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, t) => acc + (t.csat?.rating || 0), 0) / ratedTickets.length).toFixed(1))
      : 4.8;

    // Categories Breakdown
    const catMap: Record<string, number> = {};
    for (const t of this.tickets) {
      catMap[t.category] = (catMap[t.category] || 0) + 1;
    }
    const ticketsByCategory = Object.entries(catMap).map(([category, count]) => ({ category, count }));

    // Priority Breakdown
    const prioMap: Record<string, number> = {};
    for (const t of this.tickets) {
      prioMap[t.priority] = (prioMap[t.priority] || 0) + 1;
    }
    const ticketsByPriority = Object.entries(prioMap).map(([priority, count]) => ({ priority, count }));

    // Status Breakdown
    const statMap: Record<string, number> = {};
    for (const t of this.tickets) {
      statMap[t.status] = (statMap[t.status] || 0) + 1;
    }
    const ticketsByStatus = Object.entries(statMap).map(([status, count]) => ({ status, count }));

    // Volume trend (last 7 days simulated + dynamic)
    const volumeTrend = [
      { date: 'Mon', created: 18, solved: 15 },
      { date: 'Tue', created: 24, solved: 22 },
      { date: 'Wed', created: 31, solved: 28 },
      { date: 'Thu', created: 27, solved: 29 },
      { date: 'Fri', created: 35, solved: 32 },
      { date: 'Sat', created: 12, solved: 14 },
      { date: 'Sun', created: total, solved: solved }
    ];

    // Agent leaderboard
    const agents = this.users.filter(u => u.role === 'agent' || u.role === 'admin');
    const agentPerformance = agents.map(agent => {
      const assignedTickets = this.tickets.filter(t => t.assignedAgentId === agent.id);
      const solvedByAgent = assignedTickets.filter(t => t.status === 'solved' || t.status === 'closed');
      const agentRatings = assignedTickets.filter(t => t.csat).map(t => t.csat!.rating);
      const avgAgentCsat = agentRatings.length > 0
        ? Number((agentRatings.reduce((a, b) => a + b, 0) / agentRatings.length).toFixed(1))
        : 4.9;

      return {
        agentId: agent.id,
        agentName: agent.name,
        avatarUrl: agent.avatarUrl,
        assigned: assignedTickets.length,
        solved: solvedByAgent.length,
        avgFirstResponseMin: agent.id === 'usr-agent-2' ? 14 : agent.id === 'usr-agent-3' ? 22 : 18,
        avgCsat: avgAgentCsat
      };
    });

    return {
      totalTickets: total,
      openTickets: open,
      solvedTickets: solved,
      pendingTickets: pending,
      slaBreachedTickets: breachedCount,
      slaComplianceRate: complianceRate,
      avgFirstResponseMinutes: 18,
      avgResolutionHours: 2.4,
      averageCsat: avgCsat,
      csatResponsesCount: ratedTickets.length || 1,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus,
      volumeTrend,
      agentPerformance
    };
  }
}

export const db = new DatabaseStore();
