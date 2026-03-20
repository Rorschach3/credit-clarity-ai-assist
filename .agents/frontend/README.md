# Frontend — Agent Guide

## Entry Points

| File | Role |
|---|---|
| `src/main.tsx` | React DOM render root — mounts `<App />` |
| `src/App.tsx` | React Router `<Routes>` definition — all page routes live here |
| `src/index.css` | Global CSS (Tailwind base imports) |
| `src/App.css` | App-level CSS overrides |

---

## Routing

All routes are declared in `src/App.tsx` using React Router v6.

| Route | Page Component | Auth Required |
|---|---|---|
| `/` | `HomePage` | No |
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/dashboard` | `DashboardPage` | Yes |
| `/upload` | `CreditReportUploadPage` | Yes |
| `/tradelines` | `TradelinesPage` | Yes |
| `/tradelines/manage` | `TradelinesManagementPage` | Yes |
| `/disputes` | `DisputeWizardPage` | Yes |
| `/disputes/letter` | `DisputeLetterPage` | Yes |
| `/profile` | `ProfilePage` | Yes |
| `/pricing` | `PricingPage` | No |
| `/blog` | `BlogPage` | No |
| `/contact` | `ContactPage` | No |
| `/faq` | `FaqPage` | No |
| `/about` | `AboutPage` | No |
| `/admin` | `AdminPage` | Yes (admin) |
| `*` | `NotFoundPage` | No |

---

## Directory Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Router root
├── App.css / index.css         # Global styles
├── vite-env.d.ts               # Vite type declarations
│
├── pages/                      # Route-level page components
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── CreditReportUploadPage.tsx
│   ├── TradelinesPage.tsx
│   ├── TradelinesManagementPage.tsx
│   ├── DisputeWizardPage.tsx
│   ├── DisputeLetterPage.tsx
│   ├── ProfilePage.tsx
│   ├── PricingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── AdminPage.tsx
│   ├── BlogPage.tsx
│   ├── ContactPage.tsx
│   ├── FaqPage.tsx
│   ├── AboutPage.tsx
│   └── NotFoundPage.tsx
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Card, Dialog…)
│   ├── layout/                 # Page shell (sidebar, header, footer wrappers)
│   ├── navbar/                 # Navigation bar
│   ├── dashboard/              # Dashboard-specific widgets
│   ├── disputes/               # Dispute wizard components
│   ├── dispute-wizard/         # Multi-step dispute wizard flow
│   ├── credit-upload/          # File upload UI (drag & drop, preview)
│   ├── auth/                   # Login / signup form components
│   ├── admin/                  # Admin-only management UI
│   ├── debug/                  # Debug/diagnostic views
│   ├── Hero/                   # Landing-page hero section
│   ├── Process/                # "How it works" section
│   ├── Services/               # Services section
│   ├── Footer/                 # Site footer
│   ├── BlogPost.tsx            # Single blog post renderer
│   ├── CreditReportViewer.tsx  # Tradeline data viewer
│   ├── ErrorBoundary.tsx       # Global React error boundary
│   ├── current-user-avatar.tsx # User avatar with fallback
│   └── theme-provider.tsx      # Dark/light mode provider
│
├── hooks/                      # Custom React hooks
│   ├── use-auth.tsx            # Supabase auth state
│   ├── use-toast.ts            # Toast notifications
│   ├── use-mobile.tsx          # Responsive breakpoint detection
│   ├── use-theme.tsx           # Theme toggle
│   ├── use-activity-monitoring.tsx
│   ├── use-current-user-image.ts
│   ├── use-current-user-name.ts
│   ├── useAuthGuard.ts         # Redirect unauthenticated users
│   ├── useCreditReportProcessing.ts
│   ├── useCreditUploadState.ts
│   ├── useMemoryCleanup.ts
│   ├── usePaginatedTradelines.ts
│   ├── usePersistentProfile.ts
│   ├── usePersistentTradelines.ts
│   └── queries/                # React Query query/mutation hooks
│
├── services/
│   └── api.ts                  # Axios/fetch wrapper for FastAPI backend calls
│
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase JS client (singleton)
│       ├── types.ts            # Auto-generated Supabase type definitions
│       └── ...                 # Additional Supabase helpers
│
├── lib/
│   ├── utils.ts                # clsx/cn helper and misc utilities
│   ├── encryption.ts           # Client-side field encryption helpers
│   ├── knownCreditors.ts       # Fuzzy-match list of known creditor names
│   ├── react-query.ts          # QueryClient configuration
│   ├── validation/             # Zod schemas
│   └── validations.ts          # Field-level validation rules
│
└── types/
    ├── index.ts                # Re-exports
    ├── database.ts             # Supabase database row types (auto-generated)
    ├── document.ts             # Document / OCR types
    └── negative-item.ts        # NegativeItem type for dispute flow
```

---

## Key Patterns

### Data Fetching
- All server state is managed by **TanStack React Query** (`@tanstack/react-query`)
- Query keys follow the pattern `['entity', id?, filters?]`
- Custom hooks in `src/hooks/queries/` wrap `useQuery` / `useMutation`
- Direct Supabase calls use `src/integrations/supabase/client.ts`
- FastAPI calls use `src/services/api.ts`

### Authentication
- Auth state lives in `use-auth.tsx` which wraps `supabase.auth.getSession()`
- Protected routes are guarded by `useAuthGuard.ts`
- The `useAuthGuard` hook redirects to `/login` if no session exists

### Styling
- Tailwind CSS utility classes
- shadcn/ui component library (`src/components/ui/`) — based on Radix UI primitives
- Dark/light mode via `next-themes` through `theme-provider.tsx`
- Custom CSS variables defined in `src/index.css`

### Forms
- `react-hook-form` for form state management
- `@hookform/resolvers/zod` for schema-based validation
- Zod schemas defined in `src/lib/validation/`

---

## Adding a New Page

1. Create `src/pages/MyNewPage.tsx`
2. Add a route in `src/App.tsx`:
   ```tsx
   <Route path="/my-new-page" element={<MyNewPage />} />
   ```
3. If auth-protected, wrap with `<ProtectedRoute>` or add `useAuthGuard()` call inside the page

## Adding a New API Call to the Backend

1. Add the function to `src/services/api.ts`
2. Create a React Query hook in `src/hooks/queries/`
3. Use the hook inside the relevant component or page
