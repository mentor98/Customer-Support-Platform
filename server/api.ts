import express, { Router, Request, Response } from 'express';
import { db } from './db';
import {
  summarizeTicketThread,
  generateSmartReply,
  analyzeTicketSentiment,
  generateKBArticleFromTicket
} from './gemini';
import { runAutomatedTests } from './tests';
import { User, UserRole, TicketPriority, TicketCategory } from '../src/types';

export const apiRouter = Router();

// Current active session tracking (defaults to Sarah Jenkins - Admin)
let currentSessionUserId = 'usr-admin-1';

function getCurrentUser(req?: Request): User {
  const customId = req?.headers['x-user-id'] as string;
  const targetId = customId || currentSessionUserId;
  const user = db.users.find(u => u.id === targetId);
  return user || db.users[0];
}

// --- AUTH & USER MANAGEMENT ---
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  res.json({
    user,
    allUsers: db.users
  });
});

apiRouter.post('/auth/switch', (req: Request, res: Response) => {
  const { userId } = req.body;
  const target = db.users.find(u => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentSessionUserId = target.id;
  res.json({ success: true, user: target });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    currentSessionUserId = existing.id;
    return res.json({ user: existing, message: 'Existing customer logged in' });
  }

  const newUser: User = {
    id: 'usr-customer-' + Date.now(),
    name,
    email,
    role: 'customer',
    avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    title: 'Customer User',
    department: department || 'General',
    isOnline: true
  };

  db.users.push(newUser);
  currentSessionUserId = newUser.id;

  db.addAuditLog({
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: 'customer',
    action: 'CUSTOMER_REGISTERED',
    details: `Customer registered account with email ${email}`
  });

  res.status(201).json({ user: newUser });
});

apiRouter.get('/users', (req: Request, res: Response) => {
  const role = req.query.role as UserRole | undefined;
  if (role) {
    return res.json(db.users.filter(u => u.role === role));
  }
  res.json(db.users);
});

apiRouter.get('/teams', (req: Request, res: Response) => {
  res.json(db.teams);
});

apiRouter.post('/teams', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create support teams' });
  }
  const { name, description, memberIds, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  const newTeam = {
    id: 'team-' + Date.now(),
    name,
    description: description || '',
    leadId: actor.id,
    memberIds: Array.isArray(memberIds) ? memberIds : [actor.id],
    color: color || '#3B82F6'
  };
  db.teams.push(newTeam);
  res.status(201).json(newTeam);
});

// --- TICKETS ---
apiRouter.get('/tickets', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { status, priority, category, assignedAgentId, search, view } = req.query;

  // If customer, default to their own tickets
  const customerIdFilter = currentUser.role === 'customer' ? currentUser.id : undefined;

  const tickets = db.getTickets({
    status: status as string,
    priority: priority as string,
    category: category as string,
    assignedAgentId: assignedAgentId as string,
    customerId: customerIdFilter,
    search: search as string,
    view: view as string
  });

  res.json(tickets);
});

apiRouter.post('/tickets', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const { subject, description, priority, category, channel, tags, assignedTeamId, assignedAgentId, customFields, attachments, customerId } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  const effectiveCustomerId = (actor.role === 'admin' || actor.role === 'agent') && customerId ? customerId : actor.id;

  const newTicket = db.createTicket({
    subject,
    description,
    priority: priority || 'medium',
    category: category || 'general',
    channel: channel || 'portal',
    customerId: effectiveCustomerId,
    tags,
    assignedTeamId,
    assignedAgentId,
    customFields,
    attachments
  }, actor);

  res.status(201).json(newTicket);
});

apiRouter.get('/tickets/:id', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (currentUser.role === 'customer' && ticket.customerId !== currentUser.id) {
    return res.status(403).json({ error: 'Access denied to this ticket' });
  }

  res.json(ticket);
});

apiRouter.patch('/tickets/:id', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (actor.role === 'customer') {
    // Customers can only reopen or close their own ticket
    const allowed = ['status'];
    const hasUnallowed = Object.keys(req.body).some(k => !allowed.includes(k));
    if (hasUnallowed || ticket.customerId !== actor.id) {
      return res.status(403).json({ error: 'Customers can only update status of their own tickets' });
    }
  }

  const updated = db.updateTicket(req.params.id, req.body, actor);
  res.json(updated);
});

// --- TICKET MESSAGES ---
apiRouter.get('/tickets/:id/messages', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (currentUser.role === 'customer' && ticket.customerId !== currentUser.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const messages = db.getMessagesForTicket(req.params.id, currentUser.role);
  res.json(messages);
});

apiRouter.post('/tickets/:id/messages', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { content, isInternal, attachments } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message content or attachment is required' });
  }

  if (actor.role === 'customer' && isInternal) {
    return res.status(403).json({ error: 'Customers cannot create internal notes' });
  }

  const newMsg = db.addMessage(req.params.id, {
    content: content || '(Attachment only)',
    isInternal: Boolean(isInternal),
    attachments
  }, actor);

  res.status(201).json(newMsg);
});

// --- CSAT RATING ---
apiRouter.post('/tickets/:id/csat', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const ok = db.submitCSAT(req.params.id, rating, comment, actor);
  if (!ok) return res.status(404).json({ error: 'Ticket not found' });

  res.json({ success: true, message: 'Thank you for your feedback!' });
});

// --- AI COPILOT ENDPOINTS (Gemini Server-Side) ---
apiRouter.post('/tickets/:id/ai/summarize', async (req: Request, res: Response) => {
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messages = db.getMessagesForTicket(req.params.id, 'agent');
  const summary = await summarizeTicketThread(ticket.subject, ticket.description, messages);

  res.json({ summary });
});

apiRouter.post('/tickets/:id/ai/suggest-reply', async (req: Request, res: Response) => {
  const ticket = db.getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { tone } = req.body;
  const messages = db.getMessagesForTicket(req.params.id, 'agent');
  const customerMessages = messages.filter(m => !m.isInternal && m.authorRole === 'customer');
  const latestCustomerMsg = customerMessages.length > 0 ? customerMessages[customerMessages.length - 1].content : ticket.description;

  const reply = await generateSmartReply(ticket.subject, ticket.customerName, ticket.category, latestCustomerMsg, tone || 'professional');
  res.json({ reply });
});

apiRouter.post('/ai/analyze-sentiment', async (req: Request, res: Response) => {
  const { subject, description } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description required' });
  }

  const result = await analyzeTicketSentiment(subject, description);
  res.json(result);
});

apiRouter.post('/articles/ai-generate', async (req: Request, res: Response) => {
  const { ticketId } = req.body;
  const ticket = db.getTicketById(ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const messages = db.getMessagesForTicket(ticketId, 'agent');
  const agentReplies = messages.filter(m => !m.isInternal && (m.authorRole === 'agent' || m.authorRole === 'admin'));
  const solutionText = agentReplies.map(r => r.content).join('\n\n') || ticket.lastMessagePreview || 'Resolved by support team.';

  const article = await generateKBArticleFromTicket(ticket, solutionText);
  res.json(article);
});

// --- KNOWLEDGE BASE ---
apiRouter.get('/articles', (req: Request, res: Response) => {
  const { search, category } = req.query;
  const articles = db.getKBArticles(search as string, category as string);
  res.json(articles);
});

apiRouter.get('/articles/:id', (req: Request, res: Response) => {
  const article = db.kbArticles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  db.recordKBView(article.id);
  res.json(article);
});

apiRouter.post('/articles', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role === 'customer') {
    return res.status(403).json({ error: 'Customers cannot create knowledge base articles' });
  }

  const { title, category, content, tags } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const newArt = db.createKBArticle({
    title,
    category: category || 'general',
    content,
    tags: Array.isArray(tags) ? tags : ['guide'],
    authorId: actor.id,
    authorName: actor.name,
    isPublished: true
  }, actor);

  res.status(201).json(newArt);
});

apiRouter.post('/articles/:id/vote', (req: Request, res: Response) => {
  const { isHelpful } = req.body;
  const ok = db.voteKBArticle(req.params.id, Boolean(isHelpful));
  if (!ok) return res.status(404).json({ error: 'Article not found' });
  res.json({ success: true });
});

// --- CANNED RESPONSES / MACROS ---
apiRouter.get('/macros', (req: Request, res: Response) => {
  const { category } = req.query;
  res.json(db.getMacros(category as string));
});

apiRouter.post('/macros', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role === 'customer') return res.status(403).json({ error: 'Unauthorized' });

  const { title, shortcut, category, content, tags } = req.body;
  if (!title || !content || !shortcut) {
    return res.status(400).json({ error: 'Title, shortcut, and content required' });
  }

  const newMacro = db.createMacro({
    title,
    shortcut: shortcut.startsWith('/') ? shortcut : `/${shortcut}`,
    category: category || 'general',
    content,
    tags: Array.isArray(tags) ? tags : [],
    createdBy: actor.id
  }, actor);

  res.status(201).json(newMacro);
});

apiRouter.post('/macros/apply', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const { macroId, ticketId } = req.body;

  const macro = db.macros.find(m => m.id === macroId);
  const ticket = db.getTicketById(ticketId);
  if (!macro || !ticket) return res.status(404).json({ error: 'Macro or ticket not found' });

  const interpolated = db.interpolateMacro(macro.content, ticket, actor);
  res.json({ content: interpolated });
});

// --- SLA POLICIES ---
apiRouter.get('/sla/policies', (req: Request, res: Response) => {
  res.json(db.slaPolicies);
});

apiRouter.put('/sla/policies/:id', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role !== 'admin') return res.status(403).json({ error: 'Only admins can modify SLA policies' });

  const policy = db.slaPolicies.find(p => p.id === req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });

  const { firstResponseMinutes, resolutionMinutes, businessHoursOnly } = req.body;
  if (firstResponseMinutes) policy.firstResponseMinutes = Number(firstResponseMinutes);
  if (resolutionMinutes) policy.resolutionMinutes = Number(resolutionMinutes);
  if (businessHoursOnly !== undefined) policy.businessHoursOnly = Boolean(businessHoursOnly);

  db.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'SLA_POLICY_UPDATED',
    details: `Updated ${policy.priority.toUpperCase()} SLA: First response ${policy.firstResponseMinutes}m, Resolution ${policy.resolutionMinutes}m`
  });

  res.json(policy);
});

// --- LIVE CHAT ---
apiRouter.get('/chats/session', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const session = db.getOrCreateChatSession(actor);
  res.json(session);
});

apiRouter.get('/chats', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role === 'customer') {
    const session = db.getOrCreateChatSession(actor);
    return res.json([session]);
  }
  res.json(db.chatSessions);
});

apiRouter.post('/chats/:id/messages', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message text required' });

  const session = db.sendChatMessage(req.params.id, actor, message);
  if (!session) return res.status(404).json({ error: 'Chat session not found' });

  // If customer sent message, trigger simulated friendly agent typing response after 1 second if in agent console
  if (actor.role === 'customer') {
    setTimeout(() => {
      const answers = [
        "I'm checking the logs for you right now.",
        "Got it! Let me verify that configuration on our cluster.",
        "Thank you for those details. Everything is looking healthy now.",
        "I have created a linked escalations ticket for our engineers."
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
      db.sendChatMessage(session.id, db.users.find(u => u.id === 'usr-agent-1') || actor, randomAnswer);
    }, 1200);
  }

  res.json(session);
});

// --- NOTIFICATIONS ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  const notifs = db.notifications.filter(n => n.userId === actor.id);
  res.json(notifs);
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  db.notifications.forEach(n => {
    if (n.userId === actor.id) n.isRead = true;
  });
  res.json({ success: true });
});

// --- AUDIT LOGS ---
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const actor = getCurrentUser(req);
  if (actor.role === 'customer') {
    // Only logs for their own tickets
    const myTicketIds = db.tickets.filter(t => t.customerId === actor.id).map(t => t.id);
    return res.json(db.auditLogs.filter(l => l.ticketId && myTicketIds.includes(l.ticketId)));
  }
  res.json(db.auditLogs);
});

// --- ANALYTICS ---
apiRouter.get('/analytics', (req: Request, res: Response) => {
  const analytics = db.getAnalytics();
  res.json(analytics);
});

// --- AUTOMATED TESTS RUNNER ---
apiRouter.post('/tests/run', async (req: Request, res: Response) => {
  try {
    const testResults = await runAutomatedTests();
    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;

    res.json({
      summary: {
        total: testResults.length,
        passed,
        failed,
        success: failed === 0,
        executedAt: new Date().toISOString()
      },
      results: testResults
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Test execution failed: ' + err.message });
  }
});
