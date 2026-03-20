# CODEBASE MAP — Credit Clarity AI Assist
<!-- ai-agent-index: true -->
> **Purpose:** Structured reference for AI agents to autonomously traverse, run, diagnose, and self-heal this codebase.  
> Every section is machine-readable. Use the anchors (`#anchor-name`) to jump to any layer.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Commands Quick-Reference](#3-commands-quick-reference)
4. [Environment & Configuration](#4-environment--configuration)
5. [Full Directory Tree](#5-full-directory-tree)
6. [Entry Points](#6-entry-points)
7. [Routing Map](#7-routing-map)
8. [Authentication Flow](#8-authentication-flow)
9. [Layer-by-Layer File Reference](#9-layer-by-layer-file-reference)
   - [9.1 Pages](#91-pages)
   - [9.2 Components](#92-components)
   - [9.3 Hooks](#93-hooks)
   - [9.4 Services & API](#94-services--api)
   - [9.5 Utils](#95-utils)
   - [9.6 Types](#96-types)
   - [9.7 Lib](#97-lib)
   - [9.8 Integrations (Supabase)](#98-integrations-supabase)
   - [9.9 Supabase Edge Functions](#99-supabase-edge-functions)
   - [9.10 Database Schema](#910-database-schema)
   - [9.11 Supabase Migrations](#911-supabase-migrations)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Key Patterns & Conventions](#11-key-patterns--conventions)
12. [Diagnosis & Self-Healing Guide](#12-diagnosis--self-healing-guide)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Archive / Legacy Files](#14-archive--legacy-files)

---

## 1. Project Overview

**Credit Clarity AI Assist** is a React + TypeScript SPA that helps users:
- Upload credit reports (PDF / image) via OCR (AWS Textract, Google Document AI, or Tesseract)
- Automatically parse tradelines (individual credit accounts) from the extracted text
- Identify negative items and suggest dispute reasons
- Generate FCRA-compliant dispute letters (per credit bureau) — powered by OpenAI GPT-4
- Track dispute history and account status via a dashboard
- Admin portal for user management, audit logs, and postage management

**Backend:** Supabase (Postgres + Auth + Storage + Edge Functions).  
**Deployment:** Vercel (triggered on push to `main` / `dev` via GitHub Actions).

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript 5 |
| Bundler | Vite 6 |
| Routing | React Router DOM v6 |
| State / data-fetching | TanStack React Query v5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Edge functions | Deno (Supabase Edge Functions) |
| AI / LLM | OpenAI GPT-4 (dispute letters), Google Vertex AI / Document AI (OCR) |
| OCR | AWS Textract (via edge function), Tesseract.js (client-side fallback) |
| PDF generation | jsPDF |
| Testing | Jest 29 + ts-jest + Testing Library |
| Linting | ESLint 9 + typescript-eslint |
| CI/CD | GitHub Actions → Vercel |

---

## 3. Commands Quick-Reference

```bash
# Install dependencies
npm ci

# Start dev server (http://localhost:5173 by default)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Lint (ESLint)
npm run lint

# Run tests (Jest)
npm test

# Run tests with coverage report
npm run test:coverage

# Bundle analysis (Vite build + visualizer)
npm run analyze
```

**Test file locations:**
- `src/utils/tradeline/validateAndFormat.test.ts` — unit tests for tradeline validation
- `src/utils/setupTests.ts` — global Jest setup (jsdom environment)

**Jest config:** `jest.config.ts` — preset `ts-jest`, env `jsdom`, alias `@/` → `src/`

---

## 4. Environment & Configuration

| File | Purpose |
|---|---|
| `vite.config.ts` | Main Vite config; path alias `@` → `src/` |
| `vite.config.analyzer.ts` | Vite config with `rollup-plugin-visualizer` for bundle analysis |
| `vite.config.simple.ts` | Minimal Vite config (no plugins) |
| `tsconfig.json` | Root TypeScript config (references app + node) |
| `tsconfig.app.json` | App-specific TS config (strict mode, JSX) |
| `tsconfig.node.json` | Node-specific TS config (for Vite/build scripts) |
| `postcss.config.js` | PostCSS → Tailwind + Autoprefixer |
| `tailwind.config.ts` | Tailwind theme tokens, content paths, plugins |
| `eslint.config.js` | ESLint flat config with React hooks + refresh rules |
| `components.json` | shadcn/ui component registry configuration |
| `.github/workflows/main.yml` | CI/CD pipeline (build + Vercel deploy) |
| `supabase/config.toml` | Supabase project configuration |
| `requirements.txt` | Python dependencies (for legacy Python backend scripts) |

**Required environment variables (set via Vercel / Supabase dashboard — never hardcode):**

| Variable | Used by |
|---|---|
| `OPENAI_API_KEY` | `supabase/functions/generate-dispute-letter/index.ts` |
| `VERCEL_TOKEN` | GitHub Actions deploy step |
| `VERCEL_PROJECT_ID` | GitHub Actions deploy step |
| `GOOGLE_APPLICATION_CREDENTIALS` / `DOCAI_PROCESSOR_ID` | `supabase/functions/docai-ocr/index.ts` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | `supabase/functions/textract-ocr/index.ts` |

**Supabase client config** (`src/integrations/supabase/client.ts`):
- URL and anon key are embedded (public). Never store service-role key in frontend.
- Auth options: `localStorage`, `persistSession: true`, `autoRefreshToken: true`

---

## 5. Full Directory Tree

```
credit-clarity-ai-assist/
├── CODEBASE_MAP.md            ← THIS FILE (AI agent index)
├── README.md
├── OCR_Fast_Processing_Plan.md
├── project-research-export.yaml
├── package.json               ← scripts, dependencies
├── package-lock.json
├── vite.config.ts
├── vite.config.analyzer.ts
├── vite.config.simple.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── eslint.config.js
├── jest.config.ts
├── components.json            ← shadcn/ui registry
├── index.html                 ← SPA entry HTML (mounts #root)
├── requirements.txt           ← Python deps (legacy)
├── deno.d.ts                  ← Deno type declarations
│
├── .github/
│   └── workflows/
│       └── main.yml           ← CI/CD: build + Vercel deploy
│
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/                       ← ALL application source code
│   ├── main.tsx               ← React DOM bootstrap
│   ├── App.tsx                ← Root component: providers + routing
│   ├── App.css                ← App-level styles
│   ├── index.css              ← Global Tailwind directives
│   ├── vite-env.d.ts          ← Vite env type shims
│   │
│   ├── pages/                 ← Route-level components (one per URL)
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CreditReportUploadPage.tsx
│   │   ├── CreditReportUploadPageOld.tsx  ← legacy, not routed
│   │   ├── DisputeLetterPage.tsx
│   │   ├── DisputeWizardPage.tsx
│   │   ├── DisputeWizardPageOld.tsx       ← legacy, not routed
│   │   ├── TradelinesPage.tsx
│   │   ├── TradelinesManagementPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── DebugPage.tsx
│   │   ├── BlogPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── FaqPage.tsx
│   │   ├── PricingPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── components/            ← Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── BlogPost.tsx
│   │   ├── CreditReportViewer.tsx
│   │   ├── theme-provider.tsx
│   │   ├── current-user-avatar.tsx
│   │   │
│   │   ├── layout/            ← App shell
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── NavbarLink.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ModeToggle.tsx
│   │   │
│   │   ├── navbar/
│   │   │   └── CreditNavbar.tsx
│   │   │
│   │   ├── Hero/
│   │   │   └── Hero.tsx
│   │   │
│   │   ├── Services/
│   │   │   ├── ServicesGrid.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   └── creditReportService.ts
│   │   │
│   │   ├── Process/
│   │   │   └── ProcessTimeline.tsx
│   │   │
│   │   ├── Contact/
│   │   │   └── ContactForm.tsx
│   │   │
│   │   ├── Footer/
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── AdminRoute.tsx        ← Guards admin-only routes
│   │   │
│   │   ├── admin/
│   │   │   ├── AuditLog.tsx
│   │   │   ├── DisputeManagement.tsx
│   │   │   ├── PostageManagement.tsx
│   │   │   ├── RealTimeQueue.tsx
│   │   │   ├── TotpSetup.tsx
│   │   │   └── UserManagement.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── SimpleCreditDashboard.tsx ← main dashboard shell
│   │   │   ├── Overview.tsx
│   │   │   ├── DisputesTab.tsx
│   │   │   ├── UploadReportsTab.tsx
│   │   │   ├── DisputeLettersTable.tsx
│   │   │   ├── DisputeSummary.tsx
│   │   │   ├── CreditScoreCard.tsx
│   │   │   ├── CreditScoreProgress.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── ActivityItem.tsx
│   │   │   ├── BillingInfo.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── MailStatus.tsx
│   │   │   ├── NegativeItemsDialog.tsx
│   │   │   └── UploadTips.tsx
│   │   │
│   │   ├── credit-upload/
│   │   │   ├── CreditUploadHeader.tsx
│   │   │   ├── FileUploadHandler.tsx     ← coordinates upload → parse → save
│   │   │   ├── FileUploadSection.tsx
│   │   │   ├── UploadMethodSelector.tsx
│   │   │   ├── ProcessingMethodSelector.tsx
│   │   │   ├── ProcessingProgress.tsx
│   │   │   ├── TradelinesList.tsx
│   │   │   ├── PaginatedTradelinesList.tsx
│   │   │   ├── TradelineEditor.tsx
│   │   │   ├── AIAnalysisResults.tsx
│   │   │   └── UploadActions.tsx
│   │   │
│   │   ├── disputes/
│   │   │   ├── DisputeLetterGenerator.tsx
│   │   │   ├── EnhancedDisputeLetterGenerator.tsx
│   │   │   ├── AIDisputeLetterGenerator.tsx  ← calls generate-dispute-letter edge fn
│   │   │   ├── DisputePacketBuilder.tsx
│   │   │   ├── DisputeLetterPreview.tsx
│   │   │   ├── BureauTabs.tsx
│   │   │   ├── TradelineGrid.tsx
│   │   │   ├── TradelineList.tsx
│   │   │   ├── NegativeItemsList.tsx
│   │   │   ├── ManualDisputeForm.tsx
│   │   │   ├── ManualTradelineModal.tsx
│   │   │   ├── PersonalInfoForm.tsx
│   │   │   ├── UserInfoForm.tsx
│   │   │   ├── LetterEditor.tsx
│   │   │   ├── LetterGeneratorForm.tsx
│   │   │   ├── LetterGeneratorLayout.tsx
│   │   │   ├── LetterGeneratorNav.tsx
│   │   │   ├── LetterPreview.tsx
│   │   │   ├── InputMethodTabs.tsx
│   │   │   ├── CompletionStep.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── SkipDocumentsAlert.tsx
│   │   │   ├── MailingInstructions.tsx
│   │   │   ├── DocumentUploadSection.tsx
│   │   │   ├── DocumentUploader.tsx
│   │   │   ├── GenerateLettersSection.tsx
│   │   │   ├── UserDocumentsSection.tsx
│   │   │   ├── generateDisputeLetter.ts     ← pure helper (no JSX)
│   │   │   └── negative-items/
│   │   │       ├── AiAlert.tsx
│   │   │       ├── AiHeader.tsx
│   │   │       ├── ListActions.tsx
│   │   │       └── NegativeItemCard.tsx
│   │   │
│   │   ├── dispute-wizard/
│   │   │   ├── DisputeWizardHeader.tsx
│   │   │   ├── DisputeLetterGeneration.tsx
│   │   │   ├── ProfileRequirements.tsx
│   │   │   ├── ProfileSummary.tsx
│   │   │   └── TradelineSelection.tsx
│   │   │
│   │   ├── document/
│   │   │   ├── DocumentScanner.tsx
│   │   │   ├── FileUploadZone.tsx
│   │   │   ├── ScanStatus.tsx
│   │   │   └── SubscriptionPrompt.tsx
│   │   │
│   │   ├── debug/
│   │   │   └── PDFDebugger.tsx
│   │   │
│   │   └── ui/                ← shadcn/ui primitives (auto-generated)
│   │       ├── index.ts       ← barrel export for all ui components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── beams-background.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input.tsx
│   │       ├── input-otp.tsx
│   │       ├── label.tsx
│   │       ├── loading.tsx    ← named loading skeletons (PageLoading, DashboardLoading, …)
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── popover.tsx
│   │       ├── profile-status.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle.tsx
│   │       ├── toggle-group.tsx
│   │       ├── tooltip.tsx
│   │       ├── tradelines-status.tsx
│   │       └── use-toast.ts
│   │
│   ├── hooks/                 ← Custom React hooks
│   │   ├── use-auth.tsx              ← AuthProvider + useAuth (Supabase session)
│   │   ├── use-theme.tsx             ← ThemeProvider + useTheme (light/dark)
│   │   ├── use-mobile.tsx            ← useIsMobile (breakpoint detection)
│   │   ├── use-toast.ts              ← useToast (sonner wrapper)
│   │   ├── use-activity-monitoring.tsx
│   │   ├── use-current-user-image.ts
│   │   ├── use-current-user-name.ts
│   │   ├── useAuthGuard.ts           ← redirect unauthenticated users
│   │   ├── useCreditReportProcessing.ts ← OCR/AI file processing logic
│   │   ├── useCreditUploadState.ts   ← upload wizard state machine
│   │   ├── useMemoryCleanup.ts       ← cleanup large in-memory blobs
│   │   ├── usePaginatedTradelines.ts ← paginated tradeline list state
│   │   ├── usePersistentProfile.ts   ← user profile CRUD with DB sync
│   │   ├── usePersistentTradelines.ts ← tradeline CRUD + cache management
│   │   └── queries/
│   │       ├── useDashboardQueries.ts    ← React Query hooks for dashboard data
│   │       └── useTradelinesQueries.ts   ← React Query hooks for tradeline data
│   │
│   ├── services/
│   │   └── api.ts             ← Supabase CRUD wrappers: tradelinesApi, disputesApi, profileApi, dashboardApi
│   │
│   ├── utils/                 ← Pure utility functions (no React)
│   │   ├── tradelineParser.ts          ← loadAllTradelinesFromDatabase + ParsedTradeline
│   │   ├── tradelineSync.ts            ← in-memory cache + syncTradelinesFromDatabase
│   │   ├── groupTradelinesByAccount.ts ← group tradelines by creditor/account
│   │   ├── creditorMatching.ts         ← fuzzy matching for creditor names (fuzzball)
│   │   ├── disputeUtils.ts             ← generateDisputeLetterContent, generatePDFPacket
│   │   ├── helpers.ts                  ← misc formatting/string helpers
│   │   ├── bureau-constants.ts         ← bureau names + mailing addresses
│   │   ├── knownCreditors.ts           ← static list of known creditors (mirror of lib/)
│   │   ├── buildStoragePath.ts         ← Supabase storage path builder
│   │   ├── asyncProcessing.ts          ← async queue / batching utilities
│   │   ├── document-ai-parser.ts       ← Google Document AI response parser
│   │   ├── document-ai-processor.ts    ← calls textract-ocr edge fn + parses result
│   │   ├── pdf-processor.ts            ← PDF.js page → canvas → image conversion
│   │   ├── pdfToImage.ts               ← PDF page to Base64 image
│   │   ├── textract-processor.ts       ← helper to invoke textract-ocr edge fn
│   │   ├── setupTests.ts               ← Jest global setup
│   │   ├── debug/
│   │   │   └── loggers.ts              ← structured debug loggers
│   │   └── tradeline/
│   │       ├── types.ts                ← ParsedTradelineSchema (Zod) + utility fns
│   │       ├── parser.ts               ← parseTradeline, parseTradelinesFromText
│   │       ├── database.ts             ← DB read/write for individual tradelines
│   │       └── validateAndFormat.test.ts ← Jest unit tests
│   │
│   ├── types/                 ← Shared TypeScript type definitions
│   │   ├── index.ts           ← DocumentAIResponse, User, re-exports ParsedTradeline
│   │   ├── database.ts        ← Manual DB types (supplementary to auto-generated)
│   │   ├── document.ts        ← Document upload/scan types
│   │   └── negative-item.ts   ← NegativeItem interface
│   │
│   ├── lib/                   ← Low-level utilities & configuration
│   │   ├── utils.ts           ← cn() (clsx + tailwind-merge)
│   │   ├── react-query.ts     ← queryClient singleton
│   │   ├── encryption.ts      ← AES encryption helpers for sensitive data
│   │   ├── knownCreditors.ts  ← Static list of major creditors
│   │   └── validation/
│   │       ├── contactFormSchema.ts   ← Zod schema for contact form
│   │       └── personalInfoSchema.ts  ← Zod schema for personal info form
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      ← createClient (exported as `supabase`)
│   │       ├── types.ts       ← Auto-generated Database type (DO NOT edit manually)
│   │       └── schema.ts      ← Optional hand-written schema helpers
│   │
│   └── styles/
│       └── globals.css        ← Additional global styles
│
├── supabase/
│   ├── config.toml            ← Supabase project & feature flags
│   ├── .gitignore
│   ├── functions/             ← Deno edge functions (deployed to Supabase)
│   │   ├── add-tradeline/
│   │   │   ├── index.ts       ← POST /functions/v1/add-tradeline
│   │   │   └── deno.json
│   │   ├── check-admin-status/
│   │   │   └── index.ts       ← POST /functions/v1/check-admin-status
│   │   ├── docai-ocr/
│   │   │   ├── index.ts       ← POST /functions/v1/docai-ocr (Google Document AI)
│   │   │   └── deno.json
│   │   ├── generate-dispute-letter/
│   │   │   └── index.ts       ← POST /functions/v1/generate-dispute-letter (OpenAI)
│   │   ├── generate-totp-secret/
│   │   │   └── index.ts       ← POST /functions/v1/generate-totp-secret
│   │   └── textract-ocr/
│   │       └── index.ts       ← POST /functions/v1/textract-ocr (AWS Textract)
│   └── migrations/            ← SQL migration files (chronological)
│       ├── 20250630093534-*.sql
│       ├── 20250707_fix_profiles_rls.sql
│       ├── 20250830123647_*.sql
│       ├── 20250830123711_*.sql
│       ├── 20250830123738_*.sql
│       ├── 20250830123939_*.sql
│       ├── 20250830124028_*.sql
│       ├── 20250830124106_*.sql
│       ├── 20250902111820_*.sql
│       ├── 20250902111921_*.sql
│       └── 20250902112006_*.sql
│
└── archive/                   ← Superseded page components (not imported)
    ├── BillingPage.tsx
    ├── DisputeGeneratorPage.tsx
    ├── DisputeWizardPage2.tsx
    └── ProgressTrackingPage.tsx
```

---

## 6. Entry Points

| File | Role |
|---|---|
| `index.html` | Browser entry — mounts `<div id="root">`, loads `src/main.tsx` |
| `src/main.tsx` | `ReactDOM.createRoot('#root').render(<App />)` |
| `src/App.tsx` | Wraps: `ErrorBoundary` → `QueryClientProvider` → `AuthProvider` → `Router` → `AppContent` |
| `src/App.tsx::AppContent` | Renders `<Navbar>` + all `<Route>` entries + `<Footer>` |

---

## 7. Routing Map

Defined in `src/App.tsx`. All routes are rendered inside `<AnimatePresence>`.

| Path | Component | Lazy? | Auth required? |
|---|---|---|---|
| `/` | `Hero` + `ServicesGrid` + `ProcessTimeline` + `ContactForm` | ✅ | ❌ |
| `/home` | `HomePage` | ❌ | ❌ |
| `/signup` | `SignupPage` | ❌ | ❌ |
| `/login` | `LoginPage` | ❌ | ❌ |
| `/forgot-password` | `ForgotPasswordPage` | ❌ | ❌ |
| `/reset-password` | `ResetPasswordPage` | ❌ | ❌ |
| `/about` | `AboutPage` | ❌ | ❌ |
| `/faq` | `FaqPage` | ❌ | ❌ |
| `/pricing` | `PricingPage` | ❌ | ❌ |
| `/blog` | `BlogPage` | ❌ | ❌ |
| `/contact` | `ContactForm` | ✅ | ❌ |
| `/dispute-letter` | `DisputeLetterPage` | ❌ | ❌ |
| `/profile` | `ProfilePage` | ✅ | ✅ (via `useAuthGuard`) |
| `/dashboard` | `DashboardPage` | ✅ | ✅ |
| `/credit-report-upload` | `CreditReportUploadPage` | ✅ | ✅ |
| `/dispute-wizard` | `DisputeWizardPage` | ✅ | ✅ |
| `/tradelines` | `TradelinesPage` | ✅ | ✅ |

> **Note:** `/admin` route is handled inside `DashboardPage` using `<AdminRoute>` guard (`src/components/auth/AdminRoute.tsx`).

---

## 8. Authentication Flow

**Provider:** `src/hooks/use-auth.tsx` — `AuthProvider` + `useAuth` hook.

```
App.tsx
 └─ AuthProvider (use-auth.tsx)
     ├─ supabase.auth.getSession()        ← restore existing session on mount
     ├─ supabase.auth.onAuthStateChange() ← listen for sign-in / sign-out events
     └─ exposes: { user, session, isLoading, login, signup, logout, signOut }
```

**Guard hook:** `src/hooks/useAuthGuard.ts`  
- Redirect to `/login` if `!user && !isLoading`

**Admin guard:** `src/components/auth/AdminRoute.tsx`  
- Calls `check-admin-status` edge function; renders children or redirect.

**Sign-up flow:**
1. `SignupPage` calls `signup(email, password)`
2. `supabase.auth.signUp()` with `emailRedirectTo: window.location.origin + '/'`
3. User confirms email → redirected back → session established
4. `profiles` row created by DB trigger

**Password reset flow:**
1. `ForgotPasswordPage` → `supabase.auth.resetPasswordForEmail()`
2. User clicks link → `/reset-password` → `supabase.auth.updateUser({ password })`

---

## 9. Layer-by-Layer File Reference

### 9.1 Pages

Each page is a full-screen React component served at a URL.

| File | Route | Key responsibilities | Key imports |
|---|---|---|---|
| `HomePage.tsx` | `/home` | Static marketing page | Layout components |
| `LoginPage.tsx` | `/login` | Email/password sign-in form | `useAuth`, `react-hook-form`, Zod |
| `SignupPage.tsx` | `/signup` | Registration form | `useAuth`, `react-hook-form`, Zod |
| `ForgotPasswordPage.tsx` | `/forgot-password` | Password reset email trigger | `supabase.auth` |
| `ResetPasswordPage.tsx` | `/reset-password` | Password update form | `supabase.auth` |
| `DashboardPage.tsx` | `/dashboard` | User dashboard with tabs | `SimpleCreditDashboard`, `useAuth`, `useDashboardQueries` |
| `CreditReportUploadPage.tsx` | `/credit-report-upload` | Upload + OCR + parse + save tradelines | `FileUploadHandler`, `useCreditUploadState`, `usePersistentTradelines` |
| `DisputeWizardPage.tsx` | `/dispute-wizard` | Multi-step dispute letter wizard | `DisputeWizardHeader`, `TradelineSelection`, `DisputeLetterGeneration` |
| `DisputeLetterPage.tsx` | `/dispute-letter` | Dispute letter generator (standalone) | `DisputeLetterGenerator`, `EnhancedDisputeLetterGenerator` |
| `TradelinesPage.tsx` | `/tradelines` | Read-only tradeline viewer | `usePersistentTradelines` |
| `TradelinesManagementPage.tsx` | — | Admin tradeline management | `usePersistentTradelines`, `tradelinesApi` |
| `ProfilePage.tsx` | `/profile` | User profile CRUD | `usePersistentProfile`, `react-hook-form` |
| `AdminPage.tsx` | — | Admin portal shell | `AuditLog`, `UserManagement`, `PostageManagement`, `RealTimeQueue` |
| `DebugPage.tsx` | — | Debug tooling (dev only) | `PDFDebugger` |
| `BlogPage.tsx` | `/blog` | Static blog listing | `BlogPost` |
| `AboutPage.tsx` | `/about` | Static about page | — |
| `ContactPage.tsx` | `/contact` | Contact form | `ContactForm` |
| `FaqPage.tsx` | `/faq` | FAQ accordion | shadcn `Accordion` |
| `PricingPage.tsx` | `/pricing` | Pricing tiers | — |
| `NotFoundPage.tsx` | `*` | 404 fallback | — |

### 9.2 Components

> UI-only; no direct Supabase calls. All data comes via props or hooks.

**Key component groups and their purpose:**

| Directory | Purpose | Primary exports |
|---|---|---|
| `layout/` | App shell: Navbar, Footer, MainLayout | `Navbar`, `Footer`, `MainLayout`, `ModeToggle` |
| `auth/` | Route guards | `AdminRoute` |
| `admin/` | Admin portal panels | `AuditLog`, `UserManagement`, `PostageManagement`, `RealTimeQueue`, `TotpSetup` |
| `dashboard/` | Dashboard widgets | `SimpleCreditDashboard`, `Overview`, `DisputesTab`, `CreditScoreCard`, `DisputeLettersTable` |
| `credit-upload/` | File upload wizard | `FileUploadHandler`, `TradelinesList`, `TradelineEditor`, `AIAnalysisResults` |
| `disputes/` | Dispute letter UI | `AIDisputeLetterGenerator`, `DisputePacketBuilder`, `BureauTabs`, `LetterEditor` |
| `dispute-wizard/` | Step-by-step wizard | `DisputeWizardHeader`, `TradelineSelection`, `DisputeLetterGeneration` |
| `document/` | Document scanner/upload | `DocumentScanner`, `FileUploadZone`, `ScanStatus` |
| `ui/` | shadcn/ui primitives | All standard primitives + custom: `loading.tsx`, `tradelines-status.tsx`, `profile-status.tsx` |

**`src/components/ui/loading.tsx` — named exports:**
```typescript
PageLoading          // Generic full-page spinner
DisputeWizardLoading // Skeleton for dispute wizard
CreditReportUploadLoading
TradelinesLoading
ProfileLoading
DashboardLoading
```

### 9.3 Hooks

| Hook | File | Returns | Notes |
|---|---|---|---|
| `useAuth` | `use-auth.tsx` | `{ user, session, isLoading, login, signup, logout, signOut }` | Must be inside `<AuthProvider>` |
| `useTheme` | `use-theme.tsx` | `{ theme, setTheme }` | Persists to localStorage |
| `useIsMobile` | `use-mobile.tsx` | `boolean` | `window.innerWidth < 768` |
| `useToast` | `use-toast.ts` | `{ toast, dismiss, toasts }` | Sonner wrapper |
| `useAuthGuard` | `useAuthGuard.ts` | `void` | Redirects to `/login` if unauthenticated |
| `useCreditReportProcessing` | `useCreditReportProcessing.ts` | `{ processWithOCR, processWithAI, isUploading, uploadProgress, aiInsights, extractedKeywords, cleanup, … }` | OCR + AI analysis of uploaded file |
| `useCreditUploadState` | `useCreditUploadState.ts` | Upload wizard state + setters | Manages multi-step upload form state |
| `usePersistentTradelines` | `usePersistentTradelines.ts` | `{ tradelines, loading, error, refreshTradelines, addTradelines, updateTradeline, deleteTradeline, getNegativeTradelines, … }` | DB-synced tradeline state with 5-min in-memory cache |
| `usePersistentProfile` | `usePersistentProfile.ts` | `{ profile, loading, saveProfile }` | User profile CRUD |
| `usePaginatedTradelines` | `usePaginatedTradelines.ts` | `{ page, pageSize, paginatedItems, totalPages, goToPage }` | Client-side pagination |
| `useMemoryCleanup` | `useMemoryCleanup.ts` | `void` | `URL.revokeObjectURL` cleanup |
| `useActivityMonitoring` | `use-activity-monitoring.tsx` | `{ lastActivity, isIdle }` | Idle detection for session expiry |
| `useDashboardQueries` | `queries/useDashboardQueries.ts` | React Query result objects | Batched dashboard data fetching |
| `useTradelinesQueries` | `queries/useTradelinesQueries.ts` | React Query result objects | Tradeline CRUD via React Query |

### 9.4 Services & API

**`src/services/api.ts`** — All Supabase database operations. Every method uses `withErrorHandling` wrapper.

```typescript
// Tradelines
tradelinesApi.getByUserId(userId)            → Tradeline[]
tradelinesApi.getNegativeByUserId(userId)    → Tradeline[]
tradelinesApi.getByUserIdAndBureau(userId, bureau) → Tradeline[]
tradelinesApi.update(tradelineId, updates)   → Tradeline
tradelinesApi.delete(tradelineId)            → void
tradelinesApi.batchUpdate(updates[])         → Tradeline[]

// Disputes
disputesApi.getByUserId(userId)              → Dispute[]
disputesApi.create(dispute)                  → Dispute

// Profiles
profileApi.getByUserId(userId)               → UserProfile | null
profileApi.update(userId, updates)           → UserProfile (upsert)

// Dashboard (parallel queries)
dashboardApi.getDashboardData(userId)        → { tradelines, disputes, profile, metrics }
```

### 9.5 Utils

| File | Key exports / functions |
|---|---|
| `tradelineParser.ts` | `loadAllTradelinesFromDatabase(userId)`, `ParsedTradeline` type, `parseTradelinesFromText(text)` |
| `tradelineSync.ts` | `syncTradelinesFromDatabase(userId)`, `refreshTradelinesSync(userId)`, `getCachedTradelines(userId)`, `setCachedTradelines(userId, items)`, `clearTradelinesCache()` |
| `tradeline/parser.ts` | `parseTradeline(rawText, userId?)`, `parseTradelinesFromText(text, userId?)`, `validateTradelines(items[])` |
| `tradeline/types.ts` | `ParsedTradelineSchema` (Zod), `ParsedTradeline`, `parseTradeline(data)`, `safelyParseTradeline(data)`, `createTradelineWithDefaults(partial)`, `validateTradelines(items[])` |
| `tradeline/database.ts` | DB read/write for single tradeline records |
| `disputeUtils.ts` | `generateDisputeLetterContent(tradelines, bureau, profile)`, `generateDisputeLetters(...)`, `generatePDFPacket(letters, updateProgress)`, `getDisputeReasons(tradeline)`, `CREDIT_BUREAU_ADDRESSES` |
| `document-ai-processor.ts` | `processAndSaveTradelines(file)` — invokes `textract-ocr` edge fn |
| `document-ai-parser.ts` | Parses Google Document AI JSON response into tradelines |
| `textract-processor.ts` | `invokeTextractOcr(file)` — lower-level Textract edge fn caller |
| `pdf-processor.ts` | `pdfToImages(file)` — renders PDF pages to canvas via PDF.js |
| `pdfToImage.ts` | `pdfPageToBase64(file, pageNum)` |
| `creditorMatching.ts` | `matchCreditorName(name, knownCreditors)` — fuzzy match via fuzzball |
| `groupTradelinesByAccount.ts` | `groupByAccount(tradelines[])` → `Record<string, ParsedTradeline[]>` |
| `bureau-constants.ts` | `BUREAUS: string[]`, bureau address map |
| `knownCreditors.ts` | `KNOWN_CREDITORS: string[]` |
| `buildStoragePath.ts` | `buildStoragePath(userId, filename)` |
| `asyncProcessing.ts` | Async queue helpers for batch operations |
| `helpers.ts` | `formatCurrency(n)`, `formatDate(d)`, `truncate(s, n)`, etc. |
| `debug/loggers.ts` | `log`, `warn`, `error` with structured context |

### 9.6 Types

| File | Key types |
|---|---|
| `types/index.ts` | `DocumentAIResponse`, `User`, re-exports `ParsedTradeline` |
| `types/database.ts` | Supplementary DB types |
| `types/document.ts` | `UploadedDocument`, `ScanResult`, `ProcessingStatus` |
| `types/negative-item.ts` | `NegativeItem` |
| `integrations/supabase/types.ts` | Auto-generated `Database` type — source of truth for all table schemas |

### 9.7 Lib

| File | Key exports |
|---|---|
| `lib/utils.ts` | `cn(...classValues)` — merge Tailwind classes |
| `lib/react-query.ts` | `queryClient` — singleton `QueryClient` |
| `lib/encryption.ts` | `encrypt(data, key)`, `decrypt(data, key)` — AES encryption for sensitive fields |
| `lib/knownCreditors.ts` | `KNOWN_CREDITORS: string[]` |
| `lib/validation/contactFormSchema.ts` | Zod schema for contact form |
| `lib/validation/personalInfoSchema.ts` | Zod schema for dispute personal info |
| `lib/validations.ts` | Shared Zod validation helpers |

### 9.8 Integrations (Supabase)

**`src/integrations/supabase/client.ts`**
```typescript
import { supabase } from '@/integrations/supabase/client';
// supabase is a typed SupabaseClient<Database>
```

**`src/integrations/supabase/types.ts`** — auto-generated, do NOT edit directly. Contains all table row/insert/update types. Regenerate with:
```bash
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

**Key tables (from `types.ts`):**

| Table | Primary key | Purpose |
|---|---|---|
| `profiles` | `id` (uuid) | User profile data; `user_id` FK → `auth.users` |
| `tradelines` | `id` (uuid) | Credit account records per user |
| `disputes` | `id` (uuid) | Dispute records per user |
| `credit_reports` | `id` (uuid) | Uploaded credit report metadata + encrypted content |
| `admin_activity_logs` | `id` (uuid) | Admin action audit trail |
| `audit_history` | `id` (uuid) | Row-level change history |
| `postage_records` | `id` (uuid) | Mail-out tracking for dispute letters |

### 9.9 Supabase Edge Functions

All functions run on Deno. Invoked from the frontend with `supabase.functions.invoke(name, { body })`.

| Function | HTTP method | Payload | Response | Purpose |
|---|---|---|---|---|
| `generate-dispute-letter` | POST | `{ personalInfo, selectedTradelines, bureaus, letterType?, customInstructions? }` | `{ success, letters: Record<bureau, string>, generatedAt }` | Calls OpenAI GPT-4 to write FCRA-compliant letters |
| `textract-ocr` | POST | `{ file: Uint8Array[], mimeType }` | `{ text: string }` | AWS Textract OCR — extracts text from PDF/image |
| `docai-ocr` | POST | `{ file: Uint8Array[], mimeType }` | `{ text: string, entities[] }` | Google Document AI OCR |
| `add-tradeline` | POST | tradeline data object | `{ success, tradeline }` | Insert a single tradeline into DB |
| `check-admin-status` | POST | `{ userId }` | `{ isAdmin: boolean }` | Checks `admin_roles` table |
| `generate-totp-secret` | POST | `{ userId }` | `{ secret, qrCodeUrl }` | Generate TOTP MFA secret |

**Fallback for `generate-dispute-letter`:** If OpenAI call fails, `generateFallbackLetter()` returns a static template (see function source).

### 9.10 Database Schema

Key column details for the most-used tables:

**`tradelines`**
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid NOT NULL REFERENCES auth.users
creditor_name    text
account_number   text
account_balance  text
credit_limit     text
monthly_payment  text
date_opened      text
account_status   text
account_type     text
credit_bureau    text    -- 'Experian' | 'Equifax' | 'TransUnion'
is_negative      boolean DEFAULT false
dispute_count    integer DEFAULT 0
created_at       timestamptz DEFAULT now()
```

**`disputes`**
```sql
id               uuid PRIMARY KEY
user_id          uuid NOT NULL REFERENCES auth.users
status           text    -- 'pending' | 'in_progress' | 'completed'
created_at       timestamptz
```

**`profiles`**
```sql
id               uuid PRIMARY KEY
user_id          uuid UNIQUE REFERENCES auth.users
first_name       text
last_name        text
address          text
city             text
state            text
zip_code         text
date_of_birth    text
ssn_last_four    text
created_at       timestamptz
```

### 9.11 Supabase Migrations

Located in `supabase/migrations/`. Applied chronologically by Supabase CLI.  
To apply locally: `npx supabase db push`  
To create new migration: `npx supabase migration new <name>`

---

## 10. Data Flow Diagrams

### Credit Report Upload Flow
```
User selects file (PDF/image)
  └─► FileUploadHandler (credit-upload/)
        ├─► [OCR path] invokeTextractOcr(file) → textract-ocr edge fn → AWS Textract → extracted text
        ├─► [DocAI path] docai-ocr edge fn → Google Document AI → extracted text
        └─► [Client OCR] Tesseract.js → extracted text
              │
              ▼
        parseTradelinesFromText(text, userId)   [utils/tradeline/parser.ts]
              │
              ▼
        ParsedTradelineSchema.parse(data)        [utils/tradeline/types.ts]
              │
              ▼
        add-tradeline edge fn OR supabase.from('tradelines').insert()
              │
              ▼
        usePersistentTradelines → setTradelines([...])
              │
              ▼
        TradelinesList / PaginatedTradelinesList (UI update)
```

### Dispute Letter Generation Flow
```
User selects negative tradelines in DisputeWizardPage / DisputeLetterPage
  └─► AIDisputeLetterGenerator  OR  generateDisputeLetters() [disputeUtils.ts]
        │
        ├─► [AI path] supabase.functions.invoke('generate-dispute-letter', { personalInfo, selectedTradelines, bureaus })
        │       └─► OpenAI GPT-4 → letter text per bureau
        │
        └─► [fallback path] generateDisputeLetterContent(tradelines, bureau, profile)  [disputeUtils.ts]
              │
              ▼
        GeneratedDisputeLetter[]  { id, creditBureau, tradelines, letterContent }
              │
              ▼
        LetterEditor → user edits
              │
              ▼
        generatePDFPacket(letters)  [disputeUtils.ts]  → jsPDF Blob
              │
              ▼
        Download link / mail send
```

### Dashboard Data Flow
```
DashboardPage mounts
  └─► useDashboardQueries  (queries/useDashboardQueries.ts)
        └─► dashboardApi.getDashboardData(userId)  [services/api.ts]
              └─► Promise.allSettled([
                    tradelinesApi.getByUserId(),
                    disputesApi.getByUserId(),
                    profileApi.getByUserId()
                  ])
              └─► returns { tradelines, disputes, profile, metrics }
                    │
                    ▼
              SimpleCreditDashboard → Overview, DisputesTab, CreditScoreCard, …
```

---

## 11. Key Patterns & Conventions

### Path Alias
`@/` maps to `src/`. Use this consistently:
```typescript
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ParsedTradeline } from '@/utils/tradeline/types';
```

### Styling
- Tailwind utility classes via `cn()` (`clsx` + `tailwind-merge`)
- Dark/light mode via `.dark` class on `<html>` (managed by `useTheme`)
- shadcn/ui components from `@/components/ui/`

### Form Handling
```typescript
// React Hook Form + Zod
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
```

### Error Handling in API calls
```typescript
// All service methods use the withErrorHandling wrapper in services/api.ts
// Edge function calls use try/catch and return { error } or throw
```

### Tradeline Validation (Zod)
```typescript
// Always validate with ParsedTradelineSchema before inserting to DB
ParsedTradelineSchema.parse(rawData)       // throws on invalid
safelyParseTradeline(rawData)              // returns { success, data } | { success: false, error }
```

### React Query Keys Convention
```typescript
['tradelines', userId]        // all tradelines
['tradelines', userId, 'negative']  // negative only
['dashboard', userId]         // full dashboard data
['profile', userId]           // user profile
```

### Toast Notifications
```typescript
import { toast } from 'sonner';
toast.success('Tradelines loaded');
toast.error('Upload failed', { description: errorMessage });
```

### Loading States (Suspense)
Heavy pages use `React.lazy()` + `<Suspense fallback={<XxxLoading />}>`.  
Named loading skeletons are in `src/components/ui/loading.tsx`.

---

## 12. Diagnosis & Self-Healing Guide

Use this section to autonomously identify root causes and apply fixes.

### Symptom → Likely Cause → Fix

#### ❌ "Tradelines not loading / empty list"
| Check | File | Action |
|---|---|---|
| User authenticated? | `use-auth.tsx` | Ensure `useAuth().user` is non-null |
| Cache stale? | `tradelineSync.ts` | Call `clearTradelinesCache()` then `syncTradelinesFromDatabase(userId)` |
| DB query error? | `services/api.ts::tradelinesApi.getByUserId` | Check `error` from Supabase call; verify RLS policy allows `SELECT` for authenticated user |
| Zod validation rejecting records? | `tradeline/types.ts::ParsedTradelineSchema` | Use `safelyParseTradeline()` to log invalid fields |

#### ❌ "OCR / file upload fails"
| Check | File | Action |
|---|---|---|
| Edge function deployed? | `supabase/functions/textract-ocr/` | Run `npx supabase functions deploy textract-ocr` |
| AWS credentials set? | Supabase dashboard → Secrets | Ensure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` are set |
| File type unsupported? | `document-ai-processor.ts` | Accept only `application/pdf`, `image/jpeg`, `image/png` |
| CORS error? | Edge function | Every edge fn must return CORS headers; check `OPTIONS` handler |

#### ❌ "Dispute letter generation fails"
| Check | File | Action |
|---|---|---|
| OpenAI key missing? | `supabase/functions/generate-dispute-letter/index.ts` | Set `OPENAI_API_KEY` in Supabase Secrets |
| Function returns error body? | Same file | Check `generateFallbackLetter()` is invoked as fallback |
| No tradelines selected? | `disputeUtils.ts::generateDisputeLetters` | Verify `selectedTradelines[]` is non-empty |
| Bureau address missing? | `disputeUtils.ts::CREDIT_BUREAU_ADDRESSES` | Must be one of `Experian`, `Equifax`, `TransUnion` (exact string) |

#### ❌ "Auth / login not working"
| Check | File | Action |
|---|---|---|
| Supabase project paused? | Supabase dashboard | Unpause the project |
| Session not persisting? | `supabase/client.ts` | Confirm `storage: localStorage`, `persistSession: true` |
| Email not confirmed? | Supabase Auth settings | Enable / disable email confirmation in project settings |
| Redirect URL mismatch? | `use-auth.tsx::signup` | `emailRedirectTo` must match allowed URLs in Supabase Auth config |

#### ❌ "Build fails (TypeScript / Vite)"
| Check | Action |
|---|---|
| Type errors in generated types? | Re-run `npx supabase gen types typescript …` to refresh `types.ts` |
| Missing `@/` alias resolution? | Check `vite.config.ts` → `resolve.alias` and `tsconfig.app.json` → `paths` |
| Circular imports? | Run `npx madge --circular src/` to detect cycles |

#### ❌ "Tests failing"
| Check | File | Action |
|---|---|---|
| Jest alias not resolving? | `jest.config.ts` | `moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" }` must be present |
| Supabase module import error? | `jest.config.ts` | `transformIgnorePatterns` must allow `@supabase/*` packages |
| Test environment wrong? | `jest.config.ts` | Must be `testEnvironment: 'jsdom'` for browser APIs |

### Self-Healing Checklist (run in order)

```
1. npm ci                                   # restore clean node_modules
2. npm run lint -- --fix                    # auto-fix linting issues
3. npx tsc --noEmit                         # surface type errors
4. npm test                                 # run test suite
5. npm run build                            # full production build
```

For Supabase issues:
```
1. npx supabase status                      # check local/remote project health
2. npx supabase db push                     # apply pending migrations
3. npx supabase functions deploy <name>     # redeploy edge function
4. npx supabase gen types typescript …      # regenerate DB types
```

### Common Code Fix Patterns

**Fix: Tradeline field missing / null after parse**
```typescript
// tradeline/types.ts — all fields have safe defaults in schema
// Ensure caller provides `created_at`:
const tradeline = createTradelineWithDefaults({ creditor_name: 'Chase', ...partial });
```

**Fix: Add a new Supabase table to the type system**
```bash
npx supabase gen types typescript \
  --project-id gywohmbqohytziwsjrps \
  --schema public > src/integrations/supabase/types.ts
```

**Fix: Clear React Query cache to force re-fetch**
```typescript
import { queryClient } from '@/lib/react-query';
queryClient.invalidateQueries({ queryKey: ['tradelines', userId] });
```

**Fix: Force-refresh tradeline state bypassing in-memory cache**
```typescript
const { refreshTradelines } = usePersistentTradelines();
await refreshTradelines(); // calls refreshTradelinesSync internally
```

---

## 13. CI/CD Pipeline

**File:** `.github/workflows/main.yml`

**Triggers:** Push to `main` or `dev`

**Jobs:**
1. **build** — `npm ci` → `npm run build` (Vite)
2. **deploy** (needs: build) — `vercel deploy --prod` using `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` secrets

**Required GitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`

**Optional (currently commented out):**
- `OPENAI_API_KEY` (for CI-time testing)
- Run tests: add `npm test` step before deploy (uncomment in workflow)

---

## 14. Archive / Legacy Files

These files exist but are **not imported** by any active route:

| File | Replacement |
|---|---|
| `archive/BillingPage.tsx` | `dashboard/BillingInfo.tsx` widget |
| `archive/DisputeGeneratorPage.tsx` | `pages/DisputeLetterPage.tsx` |
| `archive/DisputeWizardPage2.tsx` | `pages/DisputeWizardPage.tsx` |
| `archive/ProgressTrackingPage.tsx` | `dashboard/Overview.tsx` |
| `src/pages/CreditReportUploadPageOld.tsx` | `src/pages/CreditReportUploadPage.tsx` |
| `src/pages/DisputeWizardPageOld.tsx` | `src/pages/DisputeWizardPage.tsx` |

> **AI agent note:** Do NOT import or execute archived files. They may reference deprecated APIs or patterns.

---

*Last updated: auto-generated from repository structure. Update this file whenever new routes, components, or edge functions are added.*
