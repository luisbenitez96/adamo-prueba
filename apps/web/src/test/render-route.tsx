import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';
import { expect } from 'vitest';
import { createAuthRoutes } from '../app/router';
import { createRouteLoaders } from '../app/route-loaders';
import { ROUTES } from '../app/routes';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export async function renderRoutes(routes: RouteObject[], path: string, queryClient: QueryClient) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  await waitFor(() => expect(router.state.initialized).toBe(true));

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router, queryClient };
}

export function renderRoute(path: string) {
  const queryClient = createTestQueryClient();

  return renderRoutes(
    [
      ...createAuthRoutes(createRouteLoaders(queryClient)),
      { path: ROUTES.dashboard, element: <p>Destino: dashboard</p> },
    ],
    path,
    queryClient,
  );
}
