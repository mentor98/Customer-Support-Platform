export type UserRole = 'admin' | 'agent' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  teamId?: string;
  title?: string;
  isOnline?: boolean;
  department?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
  color: string;
}

export type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'account' | 'feature_request' | 'general';
export type TicketChannel = 'portal' | 'email' | 'chat' | 'api';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // data url or static url
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar: string;
  content: string;
  isInternal: boolean; // internal note vs customer reply
  createdAt: string;
  attachments?: Attachment[];
}

export interface SLAPolicy {
  id: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
}

export interface SLAStatus {
  firstResponseDeadline: string;
  firstResponseMet?: boolean;
  firstResponseAt?: string;
  resolutionDeadline: string;
  resolutionMet?: boolean;
  resolvedAt?: string;
  isFirstResponseBreached: boolean;
  isResolutionBreached: boolean;
  firstResponseRemainingMinutes: number;
  resolutionRemainingMinutes: number;
}

export interface CSATRating {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  submittedAt: string;
  ratedBy: string;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  channel: TicketChannel;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  assignedAgentId?: string;
  assignedTeamId?: string;
  tags: string[];
  sla: SLAStatus;
  csat?: CSATRating;
  createdAt: string;
  updatedAt: string;
  solvedAt?: string;
  closedAt?: string;
  messageCount: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  customFields?: Record<string, string>;
}

export interface AuditLog {
  id: string;
  ticketId?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  category: TicketCategory;
  content: string;
  authorId: string;
  authorName: string;
  helpfulCount: number;
  notHelpfulCount: number;
  views: number;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  shortcut: string; // e.g. /greeting or /refund
  category: TicketCategory;
  content: string;
  tags: string[];
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  agentId?: string;
  agentName?: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ticket_created' | 'ticket_assigned' | 'ticket_reply' | 'sla_warning' | 'sla_breached' | 'chat_message' | 'csat_received';
  ticketId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalTickets: number;
  openTickets: number;
  solvedTickets: number;
  pendingTickets: number;
  slaBreachedTickets: number;
  slaComplianceRate: number; // percentage e.g. 94.5
  avgFirstResponseMinutes: number;
  avgResolutionHours: number;
  averageCsat: number; // out of 5
  csatResponsesCount: number;
  ticketsByCategory: { category: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByStatus: { status: string; count: number }[];
  volumeTrend: { date: string; created: number; solved: number }[];
  agentPerformance: {
    agentId: string;
    agentName: string;
    avatarUrl: string;
    assigned: number;
    solved: number;
    avgFirstResponseMin: number;
    avgCsat: number;
  }[];
}

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'Auth & RBAC' | 'Ticket Lifecycle' | 'SLA Engine' | 'Messaging & Notes' | 'Knowledge Base & Macros' | 'AI Integration';
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  error?: string;
  details: string;
}
