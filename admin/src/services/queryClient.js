import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client.
 *
 * Defaults tuned for an admin dashboard:
 * - staleTime 30s: avoid refetch storms when navigating between tabs
 * - refetchOnWindowFocus false: don't surprise users with refreshes
 * - retry 1: dashboards usually fail loud, not retry forever
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
