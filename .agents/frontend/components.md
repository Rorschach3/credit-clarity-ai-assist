# Frontend Components — Agent Guide

## Component Philosophy

- **Pages** (`src/pages/`) are thin wrappers that compose feature-specific components and wire up hooks.
- **Feature components** (`src/components/<feature>/`) contain domain logic.
- **UI primitives** (`src/components/ui/`) are generic, stateless shadcn/ui components — do not add business logic here.

---

## UI Primitives (`src/components/ui/`)

These are generated/maintained by the shadcn/ui CLI. Do not edit them manually unless fixing a project-specific bug.

| Component | Usage |
|---|---|
| `Button` | Primary CTA buttons, form submissions |
| `Card` / `CardHeader` / `CardContent` | Content panels and summary cards |
| `Dialog` / `AlertDialog` | Modal overlays |
| `Form` / `FormField` / `FormItem` | React Hook Form integration |
| `Input` / `Textarea` | Text inputs |
| `Select` | Dropdown menus |
| `Table` | Data tables (tradelines, disputes) |
| `Badge` | Status indicators |
| `Tabs` | Tabbed navigation within a page |
| `Toast` / `Toaster` | Notification toasts (via `use-toast.ts`) |
| `Skeleton` | Loading placeholders |
| `Progress` | Upload / processing progress bar |
| `Separator` | Visual dividers |
| `Avatar` | User avatar with fallback initials |
| `Tooltip` | Hover explanations |
| `Sheet` | Slide-in side panels |
| `Popover` | Floating content anchored to a trigger |
| `DropdownMenu` | Action menus |

---

## Feature Components

### `src/components/credit-upload/`
Handles the file upload experience.
- Drag-and-drop zone for PDF/image files
- File validation (type, size)
- Upload progress indicator
- Preview of selected file

### `src/components/disputes/`
Renders the list of active disputes and their status.
- Dispute status badges (pending, submitted, resolved)
- Action buttons (view letter, mark resolved)

### `src/components/dispute-wizard/`
Multi-step wizard for creating a new dispute.
- Step 1: Select tradeline(s) with errors
- Step 2: Choose dispute reason
- Step 3: Review and confirm generated letter
- Step 4: Select bureau and submit

### `src/components/dashboard/`
Dashboard widgets.
- Credit score trend chart (Recharts)
- Dispute progress summary
- Recent activity feed

### `src/components/auth/`
Authentication forms.
- `LoginForm` — email/password with Supabase Auth
- `SignupForm` — registration with email verification
- `ForgotPasswordForm` — password reset request
- `ResetPasswordForm` — password reset confirmation

### `src/components/layout/`
Page shells and structural wrappers.
- `AppLayout` — wraps authenticated pages with sidebar/navbar
- `PublicLayout` — wraps public pages with navbar/footer

### `src/components/navbar/`
Navigation bar.
- Responsive (hamburger menu on mobile)
- Shows user avatar + logout when authenticated
- Shows login/signup links when unauthenticated

### `src/components/admin/`
Admin-only management interface.
- User management table
- System stats overview

### `src/components/ErrorBoundary.tsx`
Wraps the entire app. Catches unhandled React render errors and shows a user-friendly error screen.

### `src/components/CreditReportViewer.tsx`
Renders parsed tradeline data in a structured table.
- Highlights negative items in red
- Allows inline editing of fields before dispute submission

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React component file | PascalCase | `DisputeCard.tsx` |
| Hook file | camelCase with `use` prefix | `useTradelineList.ts` |
| Utility/helper file | camelCase | `formatCurrency.ts` |
| Test file | Same name + `.test.tsx` | `DisputeCard.test.tsx` |
| CSS module | Same name + `.module.css` | `DisputeCard.module.css` |

---

## Component Creation Checklist

When adding a new component:

- [ ] Place in the correct sub-folder (`ui/`, feature folder, or `pages/`)
- [ ] Export as a named or default export (default for pages, named for components)
- [ ] Accept props typed with a `TypeName + Props` interface
- [ ] Use Tailwind classes for styling — no inline styles
- [ ] Add a loading state (skeleton) if the component fetches data
- [ ] Add an error state if the component can fail
- [ ] Write at least a smoke test in `*.test.tsx`

---

## Testing Components

Tests use Jest + React Testing Library. See [`../workflows/run-code.md`](../workflows/run-code.md) for how to run tests.

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

Wrap components that require auth or React Query in test providers:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

render(
  <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
);
```
