# Frontend State Management — Agent Guide

## Overview

State in this application is divided into three categories:

| Category | Tool | Location |
|---|---|---|
| Server state (remote data) | TanStack React Query | `src/hooks/queries/` |
| Auth state | Supabase + custom hook | `src/hooks/use-auth.tsx` |
| UI / local state | React `useState` / `useReducer` | Inside components |
| Global UI state (theme) | `next-themes` | `src/components/theme-provider.tsx` |

---

## TanStack React Query

### Configuration

The `QueryClient` is configured in `src/lib/react-query.ts` and provided at the root of `src/App.tsx`.

Default settings:
- `staleTime`: 5 minutes for most queries
- `retry`: 2 retries on failure
- `refetchOnWindowFocus`: enabled

### Query Key Conventions

```ts
// Entity list
['tradelines']                    // all tradelines for current user
['tradelines', userId]            // tradelines for specific user

// Single entity
['tradeline', tradelineId]

// Filtered list
['disputes', { status: 'pending' }]
```

### Custom Query Hooks (in `src/hooks/queries/`)

Always create a dedicated hook for each query/mutation:

```ts
// src/hooks/queries/useTradelines.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTradelines() {
  return useQuery({
    queryKey: ['tradelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tradelines')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
```

### Mutations

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteTradeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tradelines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradelines'] });
    },
  });
}
```

---

## Supabase Client

**Singleton** lives at `src/integrations/supabase/client.ts`.

```ts
import { supabase } from '@/integrations/supabase/client';

// Read
const { data, error } = await supabase.from('tradelines').select('*');

// Insert
const { data, error } = await supabase.from('tradelines').insert({ ... });

// Real-time subscription
const channel = supabase
  .channel('tradelines-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tradelines' }, handler)
  .subscribe();
```

---

## Authentication State

### `use-auth.tsx`

Provides:
- `user` — the current Supabase `User` object (or `null`)
- `session` — the current `Session` (or `null`)
- `isLoading` — `true` while the initial session check is in progress
- `signOut()` — logs out the user

```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) return <Skeleton />;
  if (!user) return <Navigate to="/login" />;

  return <div>Hello, {user.email}</div>;
}
```

### `useAuthGuard.ts`

Convenience hook that redirects to `/login` if the user is not authenticated. Call it at the top of any protected page component.

```ts
import { useAuthGuard } from '@/hooks/useAuthGuard';

export function DashboardPage() {
  useAuthGuard(); // redirects if not logged in
  // ... rest of component
}
```

---

## Persistent State Hooks

### `usePersistentTradelines.ts`
Keeps tradeline data in `localStorage` so it survives page refreshes. Syncs with Supabase on mount.

### `usePersistentProfile.ts`
Persists user profile data locally.

### `usePaginatedTradelines.ts`
Handles cursor-based pagination of the tradelines list:
- `page` state
- `hasNextPage` / `hasPreviousPage`
- `fetchNextPage()` / `fetchPreviousPage()`

---

## Toast Notifications

Use the `useToast()` hook (from `src/hooks/use-toast.ts`) for user feedback:

```ts
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success
toast({ title: 'Saved', description: 'Tradeline updated.' });

// Error
toast({ title: 'Error', description: err.message, variant: 'destructive' });
```

The `<Toaster />` component must be mounted at the root (it is already in `App.tsx`).

---

## Form State

Forms use `react-hook-form` with `zod` validation:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    // call Supabase auth or API
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="email" control={form.control} render={...} />
        <Button type="submit">Login</Button>
      </form>
    </Form>
  );
}
```

---

## Theme / Dark Mode

```tsx
import { useTheme } from '@/hooks/use-theme';

const { theme, setTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
setTheme('dark');
```
