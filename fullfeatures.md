═══════════════════════════════════════════════════════════════
  FULL-STACK HRMS (Human Resource Management System) — BUILD PROMPT
  Version 1.0 | Production-Grade SaaS Application
═══════════════════════════════════════════════════════════════

You are an expert full-stack software architect and UI/UX designer. Build a complete, production-ready, multi-tenant SaaS HRMS (Human Resource Management System) application from scratch based on every requirement defined below. Do not skip any feature, module, role, or UI requirement. This is a commercial-grade application.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 3 — UI/UX DESIGN REQUIREMENTS (IMPLEMENTED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESIGN PHILOSOPHY:
  - Clean, modern, professional SaaS dashboard aesthetic
  - Inspired by top HRMS tools: Rippling, BambooHR, HiBob
  - Color Palette: Primary #4F46E5 (Indigo) + White + Neutral Grays
  - Accent: Emerald Green (#10B981) for success states
  - Warning: Amber (#F59E0B), Danger: Red (#EF4444)
  - Typography: Inter font (clean, professional)
  - Full Dark Mode support with a toggle in top nav
  - Fully Responsive: works on Desktop, Tablet, and Mobile

LAYOUT STRUCTURE:
  - Fixed Sidebar (240px wide) with collapsible mini-sidebar (72px) on toggle
  - Sidebar shows: Company Logo/Name, Navigation Menu, User Avatar + Name
  - Top Navbar: Search bar, Notifications bell with dropdown,
    Dark mode toggle, User avatar with dropdown menu
  - Main Content Area: fluid, with breadcrumbs at top

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 6 — PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/hrms-app
├── /frontend (Next.js 14 App -> Vite React)
│   ├── /src
│   │   ├── /pages
│   │   │   ├── /(auth) — login, register, forgot-password, reset-password
│   │   │   ├── /dashboard
│   │   │   ├── /employees
│   │   │   ├── /attendance
│   │   │   ├── /leave
│   │   │   ├── /payroll
│   │   │   ├── /performance
│   │   │   ├── /recruitment
│   │   │   ├── /learning
│   │   │   ├── /helpdesk
│   │   │   ├── /announcements
│   │   │   ├── /reports
│   │   │   ├── /settings
│   │   │   └── /admin — platform-level admin routes
│   │   ├── /components
│   │   ├── /hooks
│   │   ├── /integrations
│   │   ├── /lib
│   │   ├── /store
│   │   └── /types
│
├── /backend (Supabase DB + Edge Functions equivalent logic)
│
└── /docker-compose.yml (Supabase Local Dev)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 7 — DELIVERABLES CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build ALL of the following:
  [x] Complete Prisma/Supabase schema with all models, relations, indexes
  [x] All 20 feature modules (frontend pages)
  [x] Three-tier authentication system (Super Admin / Company Admin / User)
  [x] Full email auth flow (register, verify, login, forgot/reset password)
  [x] RBAC permission matrix UI (Settings)
  [x] Role-specific dashboards with real charts and live data
  [x] User-friendly, responsive UI for all pages
  [ ] All CRUD operations backend implementation mapping / edge cases
  [ ] File upload functionality (S3/R2 compatible)
  [ ] PDF generation for payslips, letters, and certificates
  [ ] Email notification system with branded templates
  [ ] Real-time notifications (Socket.io / Supabase Realtime)
  [x] Global search (Cmd+K UI Shell)
  [ ] Data export (CSV + PDF) on all reports functionality
  [x] Dark mode support
  [x] Mobile-responsive design on all pages
  [ ] PWA manifest + service worker
  [ ] API documentation (Swagger)
  [ ] Docker Compose for local development (if not using Supabase cloud)
  [ ] Seed file with realistic dummy data for demo
  [ ] README with setup instructions
