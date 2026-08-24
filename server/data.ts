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
  NotificationItem
} from '../src/types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@omnidesk.io',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Head of Customer Experience',
    isOnline: true,
    department: 'Operations'
  },
  {
    id: 'usr-agent-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@omnidesk.io',
    role: 'agent',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    teamId: 'team-tier1',
    title: 'Senior Support Specialist',
    isOnline: true,
    department: 'Customer Support'
  },
  {
    id: 'usr-agent-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@omnidesk.io',
    role: 'agent',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    teamId: 'team-tier2',
    title: 'Technical Support Engineer',
    isOnline: true,
    department: 'Escalations & Tech'
  },
  {
    id: 'usr-agent-3',
    name: 'David Chen',
    email: 'david.chen@omnidesk.io',
    role: 'agent',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    teamId: 'team-billing',
    title: 'Billing & Account Specialist',
    isOnline: false,
    department: 'Finance Support'
  },
  {
    id: 'usr-customer-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@acmecorp.com',
    role: 'customer',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    title: 'CTO at Acme Corp',
    isOnline: true,
    department: 'Engineering'
  },
  {
    id: 'usr-customer-2',
    name: 'Priya Sharma',
    email: 'priya@techflow.io',
    role: 'customer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: 'Product Operations Lead',
    isOnline: false,
    department: 'Product'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-tier1',
    name: 'Tier 1 - General Support',
    description: 'Frontline customer triage, onboarding inquiries, and general how-to guides.',
    leadId: 'usr-admin-1',
    memberIds: ['usr-agent-1'],
    color: '#3B82F6'
  },
  {
    id: 'team-tier2',
    name: 'Tier 2 - Technical Escalations',
    description: 'Deep-dive bug investigation, API troubleshooting, and webhooks failures.',
    leadId: 'usr-admin-1',
    memberIds: ['usr-agent-2'],
    color: '#8B5CF6'
  },
  {
    id: 'team-billing',
    name: 'Billing & Subscriptions',
    description: 'Invoicing issues, refunds, enterprise contract upgrades, and VAT exemptions.',
    leadId: 'usr-admin-1',
    memberIds: ['usr-agent-3'],
    color: '#10B981'
  }
];

export const INITIAL_SLA_POLICIES: SLAPolicy[] = [
  {
    id: 'sla-urgent',
    priority: 'urgent',
    firstResponseMinutes: 15,
    resolutionMinutes: 120,
    businessHoursOnly: false
  },
  {
    id: 'sla-high',
    priority: 'high',
    firstResponseMinutes: 60,
    resolutionMinutes: 360,
    businessHoursOnly: true
  },
  {
    id: 'sla-medium',
    priority: 'medium',
    firstResponseMinutes: 180,
    resolutionMinutes: 1440,
    businessHoursOnly: true
  },
  {
    id: 'sla-low',
    priority: 'low',
    firstResponseMinutes: 480,
    resolutionMinutes: 2880,
    businessHoursOnly: true
  }
];

const now = new Date();
const subtractMinutes = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();
const addMinutes = (mins: number) => new Date(now.getTime() + mins * 60000).toISOString();

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-1001',
    ticketNumber: 1001,
    subject: 'Production Webhook Failure returning 504 Gateway Timeout',
    description: 'Since 08:30 UTC today, all outbound payload events from our payment gateway integration are failing with 504 status codes. Over 450 customer orders are backlogged.',
    status: 'open',
    priority: 'urgent',
    category: 'technical',
    channel: 'portal',
    customerId: 'usr-customer-1',
    customerName: 'Alex Rivera',
    customerEmail: 'alex.rivera@acmecorp.com',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'usr-agent-2',
    assignedTeamId: 'team-tier2',
    tags: ['api', 'webhooks', 'production-incident', 'p0'],
    sla: {
      firstResponseDeadline: subtractMinutes(15),
      firstResponseMet: true,
      firstResponseAt: subtractMinutes(40),
      resolutionDeadline: addMinutes(45),
      isFirstResponseBreached: false,
      isResolutionBreached: false,
      firstResponseRemainingMinutes: 0,
      resolutionRemainingMinutes: 45
    },
    createdAt: subtractMinutes(55),
    updatedAt: subtractMinutes(12),
    messageCount: 3,
    lastMessagePreview: 'I have inspected our ingress controller logs. We have identified traffic spikes on the EU gateway.',
    lastMessageAt: subtractMinutes(12),
    customFields: {
      'Environment': 'Production',
      'Impact Level': 'Critical - Blocked Operations',
      'API Version': 'v2.4.1'
    }
  },
  {
    id: 'tkt-1002',
    ticketNumber: 1002,
    subject: 'Discrepancy on Annual Enterprise Subscription Invoice #INV-2026-90',
    description: 'We recently upgraded our tier from Business to Enterprise 50-Seat plan. However, our credit card was charged twice: once for the prorated difference and once for full renewal.',
    status: 'pending',
    priority: 'high',
    category: 'billing',
    channel: 'email',
    customerId: 'usr-customer-2',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@techflow.io',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'usr-agent-3',
    assignedTeamId: 'team-billing',
    tags: ['invoice', 'duplicate-charge', 'enterprise-billing'],
    sla: {
      firstResponseDeadline: subtractMinutes(20),
      firstResponseMet: true,
      firstResponseAt: subtractMinutes(90),
      resolutionDeadline: addMinutes(180),
      isFirstResponseBreached: false,
      isResolutionBreached: false,
      firstResponseRemainingMinutes: 0,
      resolutionRemainingMinutes: 180
    },
    createdAt: subtractMinutes(120),
    updatedAt: subtractMinutes(30),
    messageCount: 4,
    lastMessagePreview: 'I have requested the finance team to process the $1,200 refund for the duplicate charge.',
    lastMessageAt: subtractMinutes(30),
    customFields: {
      'Invoice Number': 'INV-2026-90',
      'Payment Method': 'MasterCard ending in 4921'
    }
  },
  {
    id: 'tkt-1003',
    ticketNumber: 1003,
    subject: 'Requesting SAML / Okta SSO Configuration Support',
    description: 'Our security compliance mandates migrating all employee logins to Okta SSO by end of quarter. Could you provide your IdP metadata and ACS URL configuration guide?',
    status: 'new',
    priority: 'medium',
    category: 'account',
    channel: 'portal',
    customerId: 'usr-customer-1',
    customerName: 'Alex Rivera',
    customerEmail: 'alex.rivera@acmecorp.com',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: undefined,
    assignedTeamId: 'team-tier1',
    tags: ['sso', 'okta', 'security', 'onboarding'],
    sla: {
      firstResponseDeadline: addMinutes(120),
      firstResponseMet: false,
      resolutionDeadline: addMinutes(1200),
      isFirstResponseBreached: false,
      isResolutionBreached: false,
      firstResponseRemainingMinutes: 120,
      resolutionRemainingMinutes: 1200
    },
    createdAt: subtractMinutes(35),
    updatedAt: subtractMinutes(35),
    messageCount: 1,
    lastMessagePreview: 'Our security compliance mandates migrating all employee logins to Okta SSO...',
    lastMessageAt: subtractMinutes(35)
  },
  {
    id: 'tkt-1004',
    ticketNumber: 1004,
    subject: 'Feature Request: Dark Mode and Keyboard Shortcuts for Agent Console',
    description: 'Our support team spends 8 hours daily on OmniDesk. Having a native dark mode and shortcut navigation (e.g. j/k for tickets, r for reply) would boost productivity.',
    status: 'solved',
    priority: 'low',
    category: 'feature_request',
    channel: 'portal',
    customerId: 'usr-customer-2',
    customerName: 'Priya Sharma',
    customerEmail: 'priya@techflow.io',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'usr-agent-1',
    assignedTeamId: 'team-tier1',
    tags: ['ui', 'shortcuts', 'feedback'],
    sla: {
      firstResponseDeadline: subtractMinutes(300),
      firstResponseMet: true,
      firstResponseAt: subtractMinutes(280),
      resolutionDeadline: subtractMinutes(100),
      resolutionMet: true,
      resolvedAt: subtractMinutes(80),
      isFirstResponseBreached: false,
      isResolutionBreached: false,
      firstResponseRemainingMinutes: 0,
      resolutionRemainingMinutes: 0
    },
    csat: {
      rating: 5,
      comment: 'Super fast response and thrilled that dark mode is already live!',
      submittedAt: subtractMinutes(70),
      ratedBy: 'usr-customer-2'
    },
    createdAt: subtractMinutes(320),
    updatedAt: subtractMinutes(80),
    solvedAt: subtractMinutes(80),
    messageCount: 3,
    lastMessagePreview: 'Great news! Both dark mode and full keyboard accessibility are enabled.',
    lastMessageAt: subtractMinutes(80)
  }
];

export const INITIAL_MESSAGES: TicketMessage[] = [
  // Ticket 1001 Messages
  {
    id: 'msg-1',
    ticketId: 'tkt-1001',
    authorId: 'usr-customer-1',
    authorName: 'Alex Rivera',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    content: 'Since 08:30 UTC today, all outbound payload events from our payment gateway integration are failing with 504 status codes. Over 450 customer orders are backlogged.\n\nHere is a snippet of our error log:\n```\nPOST /api/v1/webhooks/checkout\nStatus: 504 Gateway Timeout (Time elapsed: 30012ms)\n```',
    isInternal: false,
    createdAt: subtractMinutes(55),
    attachments: [
      {
        id: 'att-1',
        name: 'gateway_error_dump.log',
        size: 14320,
        type: 'text/plain',
        url: 'data:text/plain;charset=utf-8,ERROR%20504%20Gateway%20Timeout%20on%20ingress%20proxy%20node%20eu-west-3'
      }
    ]
  },
  {
    id: 'msg-2',
    ticketId: 'tkt-1001',
    authorId: 'usr-agent-2',
    authorName: 'Elena Rostova',
    authorRole: 'agent',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'INTERNAL NOTE: I checked Datadog cluster metrics. The EU payment relay node was undergoing auto-scaling node re-provisioning. I am manually routing traffic to the backup US-East queue worker.',
    isInternal: true,
    createdAt: subtractMinutes(35)
  },
  {
    id: 'msg-3',
    ticketId: 'tkt-1001',
    authorId: 'usr-agent-2',
    authorName: 'Elena Rostova',
    authorRole: 'agent',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Hi Alex,\n\nThank you for alerting us immediately. We identified an unexpected latency spike on our EU webhook egress proxy during an infrastructure node refresh.\n\nOur engineering team has diverted your webhook queues to our secondary active gateway. You should see retry deliveries processing now. Could you please check your backlog monitor and confirm if deliveries are clearing?',
    isInternal: false,
    createdAt: subtractMinutes(12)
  },

  // Ticket 1002 Messages
  {
    id: 'msg-4',
    ticketId: 'tkt-1002',
    authorId: 'usr-customer-2',
    authorName: 'Priya Sharma',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'We recently upgraded our tier from Business to Enterprise 50-Seat plan. However, our credit card was charged twice: once for the prorated difference and once for full renewal on invoice #INV-2026-90.',
    isInternal: false,
    createdAt: subtractMinutes(120)
  },
  {
    id: 'msg-5',
    ticketId: 'tkt-1002',
    authorId: 'usr-agent-3',
    authorName: 'David Chen',
    authorRole: 'agent',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    content: 'INTERNAL NOTE: Verified in Stripe dashboard. A duplicate transaction was captured due to an edge case race condition on simultaneous billing webhook triggers. Initiating standard Stripe refund.',
    isInternal: true,
    createdAt: subtractMinutes(88)
  },
  {
    id: 'msg-6',
    ticketId: 'tkt-1002',
    authorId: 'usr-agent-3',
    authorName: 'David Chen',
    authorRole: 'agent',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    content: 'Hello Priya,\n\nI reviewed your billing account and confirmed that an automated sync race condition created a duplicate pending authorization of $1,200.00.\n\nI have voided the charge and issued a full credit memo back to your card ending in 4921. It should reflect in your banking statement within 2-3 business days.',
    isInternal: false,
    createdAt: subtractMinutes(30)
  },

  // Ticket 1003 Message
  {
    id: 'msg-7',
    ticketId: 'tkt-1003',
    authorId: 'usr-customer-1',
    authorName: 'Alex Rivera',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    content: 'Our security compliance mandates migrating all employee logins to Okta SSO by end of quarter. Could you provide your IdP metadata and ACS URL configuration guide for SAML 2.0?',
    isInternal: false,
    createdAt: subtractMinutes(35)
  },

  // Ticket 1004 Messages
  {
    id: 'msg-8',
    ticketId: 'tkt-1004',
    authorId: 'usr-customer-2',
    authorName: 'Priya Sharma',
    authorRole: 'customer',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    content: 'Our support team spends 8 hours daily on OmniDesk. Having a native dark mode and shortcut navigation (e.g. j/k for tickets, r for reply) would boost productivity.',
    isInternal: false,
    createdAt: subtractMinutes(320)
  },
  {
    id: 'msg-9',
    ticketId: 'tkt-1004',
    authorId: 'usr-agent-1',
    authorName: 'Marcus Vance',
    authorRole: 'agent',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Hi Priya!\n\nGreat news! Dark Mode is natively built into OmniDesk. You can toggle it at the top-right sun/moon icon. We also support standard keyboard shortcuts.\n\nI will mark this ticket as solved, but please let us know if you need any other customizations!',
    isInternal: false,
    createdAt: subtractMinutes(80)
  }
];

export const INITIAL_KB_ARTICLES: KnowledgeBaseArticle[] = [
  {
    id: 'kb-1',
    title: 'Setting up SAML 2.0 Single Sign-On (Okta, Azure AD, Google Workspace)',
    slug: 'setting-up-saml-sso',
    category: 'account',
    content: `## SAML 2.0 Single Sign-On Configuration

OmniDesk supports SAML 2.0 identity providers including Okta, Microsoft Entra ID (Azure AD), Ping Identity, and Google Workspace.

### 1. Prerequisites
- You must have **Admin** privileges in both OmniDesk and your Identity Provider (IdP).
- Obtain your IdP Single Sign-On URL and X.509 Signing Certificate.

### 2. OmniDesk Service Provider (SP) Metadata
- **Entity ID / Audience URI**: \`https://auth.omnidesk.io/saml/metadata\`
- **Assertion Consumer Service (ACS) URL**: \`https://auth.omnidesk.io/saml/acs\`
- **Name ID Format**: \`EmailAddress\` (urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress)

### 3. Attribute Mappings
| OmniDesk Field | IdP SAML Attribute |
|---|---|
| Email | \`user.email\` |
| First Name | \`user.firstName\` |
| Last Name | \`user.lastName\` |
| Department | \`user.department\` (optional) |

### 4. Verification & Testing
Once configured, test the login in an incognito window via IdP-initiated or SP-initiated SSO.`,
    authorId: 'usr-admin-1',
    authorName: 'Sarah Jenkins',
    helpfulCount: 42,
    notHelpfulCount: 1,
    views: 890,
    tags: ['sso', 'okta', 'saml', 'security', 'enterprise'],
    isPublished: true,
    createdAt: subtractMinutes(14400),
    updatedAt: subtractMinutes(2880)
  },
  {
    id: 'kb-2',
    title: 'Troubleshooting Webhook Delivery Failures & 5xx Retries',
    slug: 'troubleshooting-webhook-deliveries',
    category: 'technical',
    content: `## Webhook Delivery Architecture & Reliability

OmniDesk delivers real-time HTTP POST notifications for ticket events, SLA warnings, and chat messages.

### Automatic Retry Policy
When an endpoint fails to return a \`2xx\` HTTP status code within 5 seconds, OmniDesk initiates exponential backoff retries:
1. **Immediate Retry**: 30 seconds
2. **2nd Attempt**: 5 minutes
3. **3rd Attempt**: 30 minutes
4. **Final Attempt**: 2 hours

### Common Error Codes
- **504 Gateway Timeout**: Your server took longer than 10,000ms to acknowledge the webhook. Ensure heavy processing is queued asynchronously.
- **401 / 403 Forbidden**: Invalid \`X-OmniDesk-Signature\` HMAC key.
- **SSL Certificate Expired**: Webhooks require TLS 1.2+ with a valid CA certificate.

### Inspecting Payloads
Navigate to **Settings > Integrations > Webhook Logs** to view request headers, payloads, and raw server response bodies.`,
    authorId: 'usr-agent-2',
    authorName: 'Elena Rostova',
    helpfulCount: 31,
    notHelpfulCount: 0,
    views: 654,
    tags: ['webhooks', 'api', 'errors', 'troubleshooting'],
    isPublished: true,
    createdAt: subtractMinutes(10000),
    updatedAt: subtractMinutes(1440)
  },
  {
    id: 'kb-3',
    title: 'Understanding Billing Cycles, Proration, and Invoice Receipts',
    slug: 'billing-cycles-proration-invoices',
    category: 'billing',
    content: `## Invoices, Payment Methods & Proration

### When are charges processed?
Subscriptions renew automatically on your billing anchor date each month or year.

### How does seat proration work?
When you add new agent seats mid-cycle:
- We calculate the unused balance of your existing plan.
- We charge only the prorated cost for the remaining days of the billing period.

### Downloading Tax Invoices
1. Go to **Customer Portal > Invoices & Billing**.
2. Click **Download PDF** beside any invoice for complete VAT/GST breakdown.`,
    authorId: 'usr-agent-3',
    authorName: 'David Chen',
    helpfulCount: 19,
    notHelpfulCount: 2,
    views: 412,
    tags: ['billing', 'invoices', 'proration', 'payment'],
    isPublished: true,
    createdAt: subtractMinutes(8000),
    updatedAt: subtractMinutes(2000)
  }
];

export const INITIAL_CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'macro-1',
    title: 'Warm Welcome & Ticket Acknowledgement',
    shortcut: '/welcome',
    category: 'general',
    content: 'Hi {{customer_name}},\n\nThank you for reaching out to OmniDesk Support. I have received your request regarding "{{ticket_subject}}" (Ticket #{{ticket_id}}).\n\nI am actively investigating this for you and will provide an update within {{sla_time}}.',
    tags: ['greeting', 'acknowledgement'],
    createdBy: 'usr-admin-1'
  },
  {
    id: 'macro-2',
    title: 'Request Diagnostic Logs & HAR File',
    shortcut: '/request-logs',
    category: 'technical',
    content: 'Hi {{customer_name}},\n\nTo help our technical engineering team investigate the issue thoroughly, could you please provide:\n1. Your browser name & version\n2. A network HAR file recording the reproduction steps\n3. Console error logs (F12 > Console tab)\n\nYou can attach these files directly to this ticket.',
    tags: ['technical', 'logs', 'har'],
    createdBy: 'usr-agent-2'
  },
  {
    id: 'macro-3',
    title: 'Duplicate Charge / Refund Confirmation',
    shortcut: '/refund-confirm',
    category: 'billing',
    content: 'Hi {{customer_name}},\n\nI have reviewed your account and processed a full refund of the duplicate transaction. The funds will return to your original payment method in 3-5 business days.\n\nThank you for your patience!',
    tags: ['billing', 'refund'],
    createdBy: 'usr-agent-3'
  },
  {
    id: 'macro-4',
    title: 'Resolution & Closing Note',
    shortcut: '/solved',
    category: 'general',
    content: 'Hi {{customer_name}},\n\nWe have verified that the issue is now resolved. I am marking this ticket as Solved.\n\nIf you have any further questions or if anything reoccurs, simply reply to this ticket to reopen it at any time.',
    tags: ['solved', 'closing'],
    createdBy: 'usr-agent-1'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    ticketId: 'tkt-1001',
    actorId: 'usr-customer-1',
    actorName: 'Alex Rivera',
    actorRole: 'customer',
    action: 'TICKET_CREATED',
    details: 'Ticket #1001 created via Customer Portal with Urgent priority',
    timestamp: subtractMinutes(55),
    ipAddress: '192.168.1.101'
  },
  {
    id: 'log-2',
    ticketId: 'tkt-1001',
    actorId: 'usr-admin-1',
    actorName: 'Sarah Jenkins',
    actorRole: 'admin',
    action: 'TICKET_ASSIGNED',
    details: 'Assigned to Elena Rostova (Tier 2 - Technical Escalations)',
    previousValue: 'Unassigned',
    newValue: 'Elena Rostova',
    timestamp: subtractMinutes(45),
    ipAddress: '10.0.4.15'
  },
  {
    id: 'log-3',
    ticketId: 'tkt-1001',
    actorId: 'usr-agent-2',
    actorName: 'Elena Rostova',
    actorRole: 'agent',
    action: 'INTERNAL_NOTE_ADDED',
    details: 'Added internal note regarding EU ingress Datadog metrics',
    timestamp: subtractMinutes(35),
    ipAddress: '10.0.4.22'
  },
  {
    id: 'log-4',
    ticketId: 'tkt-1004',
    actorId: 'usr-agent-1',
    actorName: 'Marcus Vance',
    actorRole: 'agent',
    action: 'STATUS_CHANGED',
    details: 'Status changed from Open to Solved',
    previousValue: 'open',
    newValue: 'solved',
    timestamp: subtractMinutes(80),
    ipAddress: '10.0.4.18'
  },
  {
    id: 'log-5',
    actorId: 'usr-admin-1',
    actorName: 'Sarah Jenkins',
    actorRole: 'admin',
    action: 'SLA_POLICY_UPDATED',
    details: 'Updated Urgent SLA first response target to 15 minutes',
    timestamp: subtractMinutes(1400),
    ipAddress: '10.0.4.15'
  }
];

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'chat-sess-1',
    customerId: 'usr-customer-1',
    customerName: 'Alex Rivera',
    customerEmail: 'alex.rivera@acmecorp.com',
    agentId: 'usr-agent-1',
    agentName: 'Marcus Vance',
    status: 'active',
    startedAt: subtractMinutes(15),
    messages: [
      {
        id: 'cmsg-1',
        sessionId: 'chat-sess-1',
        senderId: 'usr-customer-1',
        senderName: 'Alex Rivera',
        senderRole: 'customer',
        message: 'Hello, is there someone available to check webhook queue metrics with me?',
        timestamp: subtractMinutes(15)
      },
      {
        id: 'cmsg-2',
        sessionId: 'chat-sess-1',
        senderId: 'usr-agent-1',
        senderName: 'Marcus Vance',
        senderRole: 'agent',
        message: 'Hi Alex! Yes, Marcus from Tier 1 Support here. Elena is currently checking your ticket #1001 logs, but I can pull live pipeline stats for you right now.',
        timestamp: subtractMinutes(13)
      },
      {
        id: 'cmsg-3',
        sessionId: 'chat-sess-1',
        senderId: 'usr-customer-1',
        senderName: 'Alex Rivera',
        senderRole: 'customer',
        message: 'Awesome, thanks Marcus!',
        timestamp: subtractMinutes(10)
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-agent-2',
    title: 'Urgent Ticket Assigned',
    message: 'Ticket #1001 "Production Webhook Failure" assigned to you.',
    type: 'ticket_assigned',
    ticketId: 'tkt-1001',
    isRead: false,
    createdAt: subtractMinutes(45)
  },
  {
    id: 'notif-2',
    userId: 'usr-agent-3',
    title: 'New Customer Reply',
    message: 'Priya Sharma replied to Ticket #1002.',
    type: 'ticket_reply',
    ticketId: 'tkt-1002',
    isRead: true,
    createdAt: subtractMinutes(30)
  },
  {
    id: 'notif-3',
    userId: 'usr-agent-1',
    title: 'CSAT 5-Star Rating Received!',
    message: 'Alex Rivera rated Ticket #1004 as 5/5 stars.',
    type: 'csat_received',
    ticketId: 'tkt-1004',
    isRead: false,
    createdAt: subtractMinutes(70)
  }
];
