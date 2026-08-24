# OmniDesk — Enterprise Customer Support Platform

OmniDesk is a full-stack, enterprise-grade customer support and ticketing platform built with **React**, **Node.js/Express**, **Tailwind CSS**, and **Google Gemini AI**. Designed as a modern, high-performance alternative to Zendesk, OmniDesk streamlines customer communication, automates SLA tracking, enforces strict Role-Based Access Control (RBAC), and enhances agent productivity with AI-powered copilot tools.

---

## Key Features

### 1. Ticket Lifecycle & Omnichannel Routing
- **Status Workflows:** `New`, `Open`, `Pending`, `On Hold`, `Solved`, `Closed`.
- **Urgency Levels:** `Urgent`, `High`, `Medium`, `Low`.
- **Omnichannel Channels:** Portal, Email, Live Chat, and REST API.
- **Categorization & Custom Tags:** Auto-classified into Billing, Technical/API, Account/SSO, Feature Requests, and General Inquiries.
- **Internal Private Notes:** Distinct amber-highlighted internal notes visible exclusively to support agents.
- **Attachment Support:** Drag-and-drop file uploads for logs, error screenshots, and diagnostic documents.

### 2. Real-Time SLA Engine & Breach Monitoring
- **Dual SLA Metrics:** Calculates countdown timers for **First Response** and **Complete Resolution**.
- **Live Urgency Warning:** Real-time visual meters and breach alerts flag at-risk tickets.
- **Configurable SLA Policies:** Custom SLA thresholds per priority level.

### 3. Server-Side AI Support Copilot (Gemini 3.7 Flash)
- **Thread Auto-Summarizer:** Generates concise executive summaries of long, multi-message support threads.
- **Smart Reply Generator:** Context-aware draft replies tailored across 4 tone presets: *Professional*, *Empathetic*, *Technical*, or *Concise*.
- **Sentiment & Auto-Triage:** Automatically detects customer sentiment, pain points, and suggests appropriate tags and priority levels.
- **Ticket-to-KB Generator:** Converts resolved ticket solutions into published Knowledge Base guides with one click.

### 4. Interactive Live Chat
- **Floating Customer Widget:** Interactive widget for instant customer help.
- **Agent Live Chat Console:** Multi-session chat queue with real-time simulated responses and quick macro insertion.

### 5. Knowledge Base & Self-Service Portal
- **Rich Documentation:** Searchable, category-indexed guides with markdown rendering.
- **Customer Feedback Loop:** "Was this article helpful?" upvoting and downvoting metrics.
- **Article Authoring:** Built-in Markdown editor for agents with AI draft generation.

### 6. Canned Responses & Macros
- **Shortcut Triggers:** Quick macro insertion via syntax like `/welcome`, `/logs`, `/refund`, `/sso`.
- **Dynamic Variable Interpolation:** Auto-fills parameters such as `{{customer.name}}`, `{{ticket.id}}`, and `{{agent.name}}`.

### 7. Operations Analytics & CSAT Tracking
- **Executive KPI Dashboard:** Real-time tracking of SLA compliance rate, average first response time, average resolution time, and customer satisfaction score (CSAT).
- **Interactive Visual Meters:** Ticket distribution by category and priority.
- **Agent Performance Leaderboard:** Ranked scorecard tracking resolved tickets, response velocity, and CSAT ratings.

### 8. Immutable Audit Trail & RBAC
- **Multi-Role Security:** Granular access permissions for `Admin`, `Agent`, and `Customer`.
- **Compliance Logging:** Every status change, assignment, note, and SLA breach is logged with timestamp, actor role, and IP address.

### 9. Built-In Automated Test Suite
- Comprehensive automated test runner covering RBAC validation, ticket lifecycle transitions, SLA deadline calculations, macro expansions, and AI integration endpoints.

---

## Architecture & Technology Stack

```
 omnidesk/
 ├── server.ts                    # Main Express server entry point & Vite middleware
 ├── server/
 │   ├── api.ts                   # REST API routes (Auth, Tickets, Chat, KB, SLA, Analytics, Tests)
 │   ├── db.ts                    # In-memory database store with SLA engine & audit logger
 │   ├── gemini.ts                # Server-side Gemini 3.7 Flash AI Copilot service
 │   ├── data.ts                  # Enterprise seed data (Users, Teams, Tickets, Macros, KB)
 │   └── tests.ts                 # Automated test suite
 ├── src/
 │   ├── App.tsx                  # Root application component & layout routing
 │   ├── types.ts                 # TypeScript domain interfaces & models
 │   ├── context/
 │   │   ├── AuthContext.tsx      # RBAC state & fast role switcher
 │   │   ├── ThemeContext.tsx     # Dark/Light theme provider
 │   │   └── NotificationContext.tsx # Live notification alert polling
 │   ├── components/
 │   │   ├── Navbar.tsx           # Top bar with search, notifications, test runner, role menu
 │   │   ├── Sidebar.tsx          # Role-adaptive navigation
 │   │   ├── TicketList.tsx       # Filterable ticket queue table
 │   │   ├── TicketDetail.tsx     # Full Zendesk-like workbench & AI copilot
 │   │   ├── NewTicketModal.tsx   # Ticket creation with auto-triage
 │   │   ├── CustomerPortal.tsx   # Customer self-service dashboard
 │   │   ├── LiveChatWidget.tsx   # Live chat widget & agent console
 │   │   ├── KnowledgeBaseView.tsx # Help center & article reader
 │   │   ├── CannedResponsesManager.tsx # Canned macros editor
 │   │   ├── SLAPoliciesView.tsx  # SLA policy matrix manager
 │   │   ├── AnalyticsDashboard.tsx # Operations & CSAT metrics
 │   │   ├── AuditLogsView.tsx    # Compliance audit trail
 │   │   ├── TeamManagementView.tsx # Support teams & agents
 │   │   └── TestRunnerModal.tsx  # Interactive test execution suite
 │   └── lib/
 │       └── api.ts               # Typed frontend API client
 ├── metadata.json
 └── package.json
```

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Yes (for AI features) | Google Gemini API key for ticket summaries, smart replies, and auto-triage. |
| `PORT` | Optional (default: `3000`) | Server port (fixed to 3000 in container environment). |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Start the development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Production Build
Compile both the frontend assets and backend server bundle:
```bash
npm run build
npm start
```

---

## API Reference

### Authentication & Users
- `GET /api/auth/me` — Retrieve active authenticated user and RBAC role.
- `POST /api/auth/switch` — Switch active user session (demo / RBAC switcher).
- `POST /api/auth/register` — Register a new customer user.
- `GET /api/users` — List all registered users (filter by `?role=agent|customer|admin`).
- `GET /api/teams` — List support teams and lead agents.

### Tickets & Messages
- `GET /api/tickets` — Query tickets with filters (`status`, `priority`, `category`, `search`, `view`).
- `GET /api/tickets/:id` — Retrieve a single ticket with metadata.
- `POST /api/tickets` — Create a new support ticket.
- `PATCH /api/tickets/:id` — Update ticket status, priority, or assigned agent.
- `GET /api/tickets/:id/messages` — Retrieve ticket conversation history.
- `POST /api/tickets/:id/messages` — Post public reply or private internal note.
- `POST /api/tickets/:id/csat` — Submit customer satisfaction rating (1–5 stars with comment).

### AI Copilot Services
- `POST /api/tickets/:id/ai/summarize` — Generate concise thread summary via Gemini AI.
- `POST /api/tickets/:id/ai/suggest-reply` — Generate draft response with specified tone (`professional`, `empathetic`, `technical`, `concise`).
- `POST /api/ai/analyze-sentiment` — Auto-detect sentiment, pain points, tags, and suggested priority.
- `POST /api/articles/ai-generate` — Convert resolved ticket dialogue into a published KB guide.

### Knowledge Base & Macros
- `GET /api/articles` — Search knowledge base articles.
- `POST /api/articles` — Publish a new knowledge base article.
- `POST /api/articles/:id/vote` — Vote article as helpful or unhelpful.
- `GET /api/macros` — Retrieve canned response macros.
- `POST /api/macros` — Create a new canned macro.
- `POST /api/macros/apply` — Interpolate macro variables into a draft.

### SLA & Analytics
- `GET /api/sla/policies` — Retrieve configured SLA thresholds.
- `PUT /api/sla/policies/:id` — Update SLA response and resolution targets.
- `GET /api/analytics` — Retrieve SLA compliance, response times, and CSAT analytics.
- `GET /api/audit-logs` — Retrieve compliance audit logs.
- `POST /api/tests/run` — Execute automated test suite.

---

## Running Automated Tests

Run the built-in test suite directly via the UI by clicking the **"Run Tests"** button in the top navigation bar, or via API:

```bash
curl -X POST http://localhost:3000/api/tests/run
```

---

## License

MIT License — free for personal and commercial use.
