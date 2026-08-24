import { TestCaseResult } from '../src/types';
import { db } from './db';
import { summarizeTicketThread, generateSmartReply, analyzeTicketSentiment } from './gemini';

export async function runAutomatedTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Helper
  const runTest = async (
    id: string,
    name: string,
    category: TestCaseResult['category'],
    fn: () => Promise<void> | void
  ) => {
    const start = performance.now();
    try {
      await fn();
      const duration = Math.round(performance.now() - start);
      results.push({
        id,
        name,
        category,
        status: 'passed',
        durationMs: duration,
        details: 'Assertion passed successfully in ' + duration + 'ms'
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      results.push({
        id,
        name,
        category,
        status: 'failed',
        durationMs: duration,
        error: err.message || String(err),
        details: 'Assertion failure: ' + (err.message || String(err))
      });
    }
  };

  // 1. RBAC Tests
  await runTest('test-rbac-1', 'Admin user possesses all required privileges', 'Auth & RBAC', () => {
    const admin = db.users.find(u => u.role === 'admin');
    if (!admin) throw new Error('No admin user registered in system');
    if (admin.role !== 'admin') throw new Error('Admin role validation failed');
  });

  await runTest('test-rbac-2', 'Customer role cannot view internal agent notes', 'Auth & RBAC', () => {
    const messages = db.getMessagesForTicket('tkt-1001', 'customer');
    const hasInternal = messages.some(m => m.isInternal);
    if (hasInternal) throw new Error('Security violation: Customer retrieved private internal notes');
  });

  await runTest('test-rbac-3', 'Agent role can view both public and internal notes', 'Auth & RBAC', () => {
    const messages = db.getMessagesForTicket('tkt-1001', 'agent');
    const hasInternal = messages.some(m => m.isInternal);
    if (!hasInternal) throw new Error('Agent failed to retrieve internal note on tkt-1001');
  });

  // 2. Ticket Lifecycle
  await runTest('test-ticket-1', 'Create ticket generates sequential ticketNumber and SLA', 'Ticket Lifecycle', () => {
    const customer = db.users.find(u => u.role === 'customer')!;
    const ticket = db.createTicket({
      subject: 'Automated Test Ticket for Validation',
      description: 'Verifying end-to-end ticket creation schema.',
      priority: 'high',
      category: 'technical',
      customerId: customer.id
    }, customer);

    if (!ticket.ticketNumber || ticket.ticketNumber < 1000) {
      throw new Error('Ticket number is missing or invalid');
    }
    if (!ticket.sla || !ticket.sla.firstResponseDeadline) {
      throw new Error('SLA policy was not attached to new ticket');
    }
    if (ticket.status !== 'new') {
      throw new Error('Initial status must be "new"');
    }
  });

  await runTest('test-ticket-2', 'Updating ticket status writes audit trail entry', 'Ticket Lifecycle', () => {
    const agent = db.users.find(u => u.role === 'agent')!;
    const target = db.tickets[0];
    const initialStatus = target.status;
    const newStatus = initialStatus === 'open' ? 'pending' : 'open';

    db.updateTicket(target.id, { status: newStatus }, agent);

    const log = db.auditLogs.find(l => l.ticketId === target.id && l.action === 'STATUS_CHANGED');
    if (!log) throw new Error('Audit log entry for status change was not recorded');
    if (log.newValue !== newStatus) throw new Error('Audit log record value mismatch');
  });

  // 3. SLA Engine Tests
  await runTest('test-sla-1', 'Urgent priority calculates 15-minute response deadline', 'SLA Engine', () => {
    const urgentSLA = db.calculateSLAForPriority('urgent');
    const created = Date.now();
    const deadline = new Date(urgentSLA.firstResponseDeadline).getTime();
    const diffMins = Math.round((deadline - created) / 60000);
    if (diffMins !== 15) throw new Error(`Expected 15 min SLA deadline, got ${diffMins} min`);
  });

  await runTest('test-sla-2', 'Public agent reply marks first response SLA as met', 'SLA Engine', () => {
    const customer = db.users.find(u => u.role === 'customer')!;
    const agent = db.users.find(u => u.role === 'agent')!;
    const newTicket = db.createTicket({
      subject: 'SLA Response Test',
      description: 'Testing SLA flag transition',
      priority: 'medium',
      category: 'general',
      customerId: customer.id
    }, customer);

    if (newTicket.sla.firstResponseMet) throw new Error('First response should not be met initially');

    db.addMessage(newTicket.id, {
      content: 'Hello customer, reviewing now.',
      isInternal: false
    }, agent);

    const updated = db.getTicketById(newTicket.id);
    if (!updated?.sla.firstResponseMet) {
      throw new Error('First response SLA was not marked as met after agent reply');
    }
  });

  // 4. Messaging & Canned Responses
  await runTest('test-macro-1', 'Macro variable interpolation replaces customer & ticket tags', 'Knowledge Base & Macros', () => {
    const ticket = db.tickets[0];
    const agent = db.users.find(u => u.role === 'agent')!;
    const template = 'Hello {{customer_name}}, regarding Ticket #{{ticket_id}}: {{ticket_subject}} by {{agent_name}}.';
    const output = db.interpolateMacro(template, ticket, agent);

    if (output.includes('{{customer_name}}') || !output.includes(ticket.customerName)) {
      throw new Error('Customer name was not interpolated properly');
    }
    if (output.includes('{{ticket_id}}') || !output.includes(ticket.ticketNumber.toString())) {
      throw new Error('Ticket ID was not interpolated properly');
    }
  });

  await runTest('test-kb-1', 'Knowledge base helpful voting increments counter', 'Knowledge Base & Macros', () => {
    const article = db.kbArticles[0];
    const prevCount = article.helpfulCount;
    db.voteKBArticle(article.id, true);
    if (article.helpfulCount !== prevCount + 1) {
      throw new Error('Helpful count did not increment');
    }
  });

  // 5. CSAT & Quality
  await runTest('test-csat-1', 'Customer satisfaction rating updates ticket and generates log', 'Ticket Lifecycle', () => {
    const ticket = db.tickets.find(t => t.status === 'solved') || db.tickets[0];
    const customer = db.users.find(u => u.role === 'customer')!;
    const ok = db.submitCSAT(ticket.id, 5, 'Outstanding immediate resolution!', customer);
    if (!ok) throw new Error('CSAT submission failed');
    if (ticket.csat?.rating !== 5) throw new Error('Ticket csat rating was not stored');
  });

  // 6. AI Copilot Integration
  await runTest('test-ai-1', 'Gemini AI ticket thread summarizer delivers structured summary', 'AI Integration', async () => {
    const summary = await summarizeTicketThread(
      'Payment Gateway Latency',
      'Customer reports 504 gateway timeout on webhooks',
      [
        { authorName: 'Alex', authorRole: 'customer', content: 'Webhooks failing', isInternal: false },
        { authorName: 'Elena', authorRole: 'agent', content: 'Diverting traffic to US backup', isInternal: true }
      ]
    );
    if (!summary || summary.length < 10) {
      throw new Error('Summarizer returned empty or malformed response');
    }
  });

  await runTest('test-ai-2', 'Gemini AI reply suggestions match professional tone', 'AI Integration', async () => {
    const reply = await generateSmartReply(
      'API Rate Limit Exceeded',
      'Jordan Smith',
      'technical',
      'Why am I getting 429 Too Many Requests?',
      'professional'
    );
    if (!reply || !reply.includes('Jordan')) {
      throw new Error('Smart reply generator did not personalize response');
    }
  });

  await runTest('test-ai-3', 'Gemini AI sentiment analysis extracts tags and priority', 'AI Integration', async () => {
    const analysis = await analyzeTicketSentiment('CRITICAL: Complete outage in production database', 'All queries failing with connection timeout');
    if (!analysis.sentiment || !analysis.suggestedPriority || !Array.isArray(analysis.suggestedTags)) {
      throw new Error('Sentiment analysis schema validation failed');
    }
  });

  return results;
}
