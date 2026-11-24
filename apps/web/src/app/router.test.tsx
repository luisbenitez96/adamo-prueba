import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createAppRoutes } from './router';
import { ROUTES } from './routes';

async function renderAt(path: string) {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe('rutas de la aplicación', () => {
  it('la raíz lleva al inicio de sesión', async () => {
    const router = await renderAt('/');

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Inicia sesión');
  });

  it('una dirección que no existe lleva al inicio de sesión', async () => {
    const router = await renderAt('/esto/no/existe');

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
  });

  it.each([
    [ROUTES.login, 'Inicia sesión en tu cuenta de AdamoServices'],
    [ROUTES.register, 'Crea tu cuenta en AdamoServices'],
    [ROUTES.forgotPassword, 'Recupera tu contraseña'],
  ])('%s muestra su pantalla', async (path, title) => {
    await renderAt(path);

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });
});
