import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../app/routes';
import { apiError, FULL_SESSION, mockSession } from '../../../test/api-handlers';
import { renderApp } from '../../../test/render-app';
import { server } from '../../../test/server';

const LOGOUT_PATH = '*/api/auth/logout';

async function openDashboard() {
  mockSession({ ...FULL_SESSION, email: 'luis@correo.com' });
  const rendered = await renderApp(ROUTES.clients);
  await screen.findByRole('heading', { level: 1, name: 'Clientes' });
  return { ...rendered, sidebar: within(screen.getByRole('complementary')) };
}

describe('SidebarContent', () => {
  it('muestra el logo de la marca', async () => {
    const { sidebar } = await openDashboard();

    expect(sidebar.getByRole('img', { name: 'AdamoServices' })).toBeInTheDocument();
  });

  it('la navegación principal tiene Inicio y Clientes', async () => {
    const { sidebar } = await openDashboard();

    const nav = sidebar.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', ROUTES.home);
    expect(within(nav).getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('Clientes se marca como la página actual', async () => {
    const { sidebar } = await openDashboard();

    expect(sidebar.getByRole('link', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');
  });

  it('en Clientes, Inicio no se marca como la página actual', async () => {
    const { sidebar } = await openDashboard();

    expect(sidebar.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('en Inicio, solo Inicio se marca como la página actual', async () => {
    mockSession({ ...FULL_SESSION, email: 'luis@correo.com' });
    await renderApp(ROUTES.home);
    await screen.findByRole('heading', { level: 1, name: 'Inicio' });
    const sidebar = within(screen.getByRole('complementary'));

    expect(sidebar.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
    expect(sidebar.getByRole('link', { name: 'Clientes' })).not.toHaveAttribute('aria-current');
  });

  it('Mi perfil se anuncia como no disponible', async () => {
    const { sidebar } = await openDashboard();

    expect(sidebar.getByRole('button', { name: /Mi perfil/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('el avatar muestra la inicial del correo de la sesión', async () => {
    const { sidebar } = await openDashboard();

    expect(sidebar.getByRole('button', { name: /Mi perfil/ })).toHaveTextContent('L');
  });

  describe('cerrar sesión', () => {
    it('cierra la sesión en el servidor y lleva al inicio de sesión', async () => {
      let loggedOut = false;
      server.use(
        http.post(LOGOUT_PATH, () => {
          loggedOut = true;
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { router, sidebar } = await openDashboard();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
      expect(loggedOut).toBe(true);
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('borra de memoria los servicios para que otro usuario no los vea', async () => {
      server.use(
        http.post(LOGOUT_PATH, () => {
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { queryClient, sidebar } = await openDashboard();
      await screen.findAllByRole('article');
      expect(queryClient.getQueryData(['services'])).toBeDefined();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));
      await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' });

      expect(queryClient.getQueryData(['services'])).toBeUndefined();
    });

    it('al volver atrás tras cerrar sesión no se ve el dashboard', async () => {
      server.use(
        http.post(LOGOUT_PATH, () => {
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { router, sidebar } = await openDashboard();
      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));
      await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' });

      await router.navigate(-1);

      await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.login));
    });

    it('mientras cierra bloquea el botón, lo marca como ocupado y no permite cerrar dos veces', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      let requests = 0;
      server.use(
        http.post(LOGOUT_PATH, async () => {
          requests++;
          await gate;
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { sidebar } = await openDashboard();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));
      await waitFor(() =>
        expect(sidebar.getByRole('button', { name: 'Cerrar sesión' })).toBeDisabled(),
      );
      expect(sidebar.getByRole('button', { name: 'Cerrar sesión' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));
      release();

      await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' });
      expect(requests).toBe(1);
    });

    it('el spinner se mantiene el tiempo mínimo aunque el servidor responda al instante', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      server.use(
        http.post(LOGOUT_PATH, () => {
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const { router, sidebar } = await openDashboard();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(sidebar.getByRole('button', { name: 'Cerrar sesión' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      expect(router.state.location.pathname).toBe(ROUTES.clients);
      await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' });
    });

    it('si falla avisa, no cambia de pantalla y permite reintentar', async () => {
      server.use(http.post(LOGOUT_PATH, () => apiError(500, 'INTERNAL_ERROR', 'x')));
      const { router, sidebar } = await openDashboard();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));

      expect(await sidebar.findByRole('alert')).toHaveTextContent(
        'Tuvimos un problema en el servidor',
      );
      expect(router.state.location.pathname).toBe(ROUTES.clients);
      expect(sidebar.getByRole('button', { name: 'Cerrar sesión' })).toBeEnabled();
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.post(LOGOUT_PATH, () => HttpResponse.error()));
      const { sidebar } = await openDashboard();

      await userEvent.click(sidebar.getByRole('button', { name: 'Cerrar sesión' }));

      expect(await sidebar.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
    });
  });
});
