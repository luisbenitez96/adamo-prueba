import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect } from 'vitest';
import { createNavigationLoader } from '../app/navigation-loader';
import { createAuthRoutes } from '../app/router';
import { ROUTES } from '../app/routes';

export async function renderRoute(path: string) {
  const router = createMemoryRouter(
    [
      ...createAuthRoutes(createNavigationLoader()),
      { path: ROUTES.dashboard, element: <p>Destino: dashboard</p> },
      { path: ROUTES.changePassword, element: <p>Destino: cambiar contraseña</p> },
    ],
    { initialEntries: [path] },
  );
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  await waitFor(() => expect(router.state.initialized).toBe(true));

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router };
}
