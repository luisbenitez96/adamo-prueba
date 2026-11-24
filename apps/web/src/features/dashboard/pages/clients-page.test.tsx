import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../../../app/routes';
import { apiError, FULL_SESSION, mockSession, TEMPORARY_SESSION } from '../../../test/api-handlers';
import { pause } from '../../../test/pause';
import { renderApp } from '../../../test/render-app';
import { DESIGN_SERVICES, server } from '../../../test/server';

const SERVICES_PATH = '*/api/services';

async function openDashboard() {
  mockSession(FULL_SESSION);
  const rendered = await renderApp(ROUTES.dashboard);
  await screen.findByRole('heading', { level: 1, name: 'Clientes' });
  return rendered;
}

describe('ClientsPage', () => {
  it('muestra el título, la indicación y el acceso a todos los servicios', async () => {
    await openDashboard();

    expect(
      screen.getByText('Selecciona un servicio para ir a la gestión de clientes'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver todos los servicios' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('muestra los 4 servicios del diseño, en orden, con sus clientes', async () => {
    await openDashboard();

    const cards = await screen.findAllByRole('article');

    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Adamo Pay',
      'Adamo ID',
      'Adamo Risk',
      'Adamo Sign',
    ]);
    expect(cards.map((card) => within(card).getByText(/^[\d.]+ clientes?$/).textContent)).toEqual([
      '3.827 clientes',
      '9.411 clientes',
      '793 clientes',
      '2.738 clientes',
    ]);
  });

  it('cada tarjeta lleva la descripción y el color de su servicio', async () => {
    await openDashboard();

    const cards = await screen.findAllByRole('article');

    expect(within(cards[0]!).getByText('Gestión de pagos')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('Verificación de identidad')).toBeInTheDocument();
    expect(within(cards[2]!).getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#7839ee' });
    expect(within(cards[3]!).getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#3e4784' });
  });

  describe('mientras cargan los servicios', () => {
    it('muestra un spinner en lugar de las tarjetas y marca la zona como ocupada', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.get(SERVICES_PATH, async () => {
          await gate;
          return HttpResponse.json({ services: DESIGN_SERVICES });
        }),
      );

      await openDashboard();

      expect(screen.getByRole('status')).toHaveTextContent('Cargando servicios');
      expect(screen.queryByRole('article')).toBeNull();
      expect(screen.getByRole('region')).toContainElement(screen.getByRole('status'));
      release();
      expect(await screen.findAllByRole('article')).toHaveLength(4);
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('el spinner se mantiene el tiempo mínimo aunque el servidor responda al instante', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '300');
      await openDashboard();
      await pause(100);

      expect(screen.getByRole('status')).toHaveTextContent('Cargando servicios');
      expect(screen.queryByRole('article')).toBeNull();
      expect(await screen.findAllByRole('article')).toHaveLength(4);
    });
  });

  describe('sin servicios', () => {
    it('avisa que todavía no hay ninguno', async () => {
      server.use(http.get(SERVICES_PATH, () => HttpResponse.json({ services: [] })));

      await openDashboard();

      expect(await screen.findByText('Todavía no hay servicios disponibles.')).toBeInTheDocument();
      expect(screen.queryByRole('article')).toBeNull();
    });
  });

  describe('errores al cargar', () => {
    it('si el servidor falla muestra un mensaje genérico sin detalles internos y permite reintentar', async () => {
      server.use(http.get(SERVICES_PATH, () => apiError(500, 'INTERNAL_ERROR', 'Mongo caído')));

      await openDashboard();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Tuvimos un problema en el servidor');
      expect(alert).not.toHaveTextContent('Mongo');
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeEnabled();
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.get(SERVICES_PATH, () => HttpResponse.error()));

      await openDashboard();

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor',
      );
    });

    it('"Reintentar" vuelve a pedir los servicios y muestra las tarjetas cuando ya responde', async () => {
      server.use(http.get(SERVICES_PATH, () => apiError(500, 'INTERNAL_ERROR', 'x')));
      await openDashboard();
      await screen.findByRole('alert');

      server.use(http.get(SERVICES_PATH, () => HttpResponse.json({ services: DESIGN_SERVICES })));
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(await screen.findAllByRole('article')).toHaveLength(4);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('mientras reintenta vuelve a mostrar el spinner de carga en lugar del error', async () => {
      server.use(http.get(SERVICES_PATH, () => apiError(500, 'INTERNAL_ERROR', 'x')));
      await openDashboard();
      await screen.findByRole('alert');
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.get(SERVICES_PATH, async () => {
          await gate;
          return HttpResponse.json({ services: DESIGN_SERVICES });
        }),
      );

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByRole('status')).toHaveTextContent('Cargando servicios');
      expect(screen.queryByRole('alert')).toBeNull();
      release();
      expect(await screen.findAllByRole('article')).toHaveLength(4);
    });

    it('si el servidor responde con datos inválidos no muestra tarjetas, solo un error', async () => {
      server.use(
        http.get(SERVICES_PATH, () =>
          HttpResponse.json({ services: [{ ...DESIGN_SERVICES[0], accentColor: 'red' }] }),
        ),
      );

      await openDashboard();

      expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado');
      expect(screen.queryByRole('article')).toBeNull();
    });
  });

  describe('si la sesión deja de ser válida al pedir los servicios', () => {
    it('con un 401 lleva al inicio de sesión', async () => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ session: ++sessionChecks === 1 ? FULL_SESSION : null }),
        ),
        http.get(SERVICES_PATH, () => apiError(401, 'UNAUTHENTICATED', 'x')),
      );

      const { router } = await renderApp(ROUTES.dashboard);

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('con un 403 porque debe cambiar la contraseña lleva a cambiarla', async () => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ session: ++sessionChecks === 1 ? FULL_SESSION : TEMPORARY_SESSION }),
        ),
        http.get(SERVICES_PATH, () => apiError(403, 'PASSWORD_CHANGE_REQUIRED', 'x')),
      );

      const { router } = await renderApp(ROUTES.dashboard);

      expect(
        await screen.findByRole('heading', { name: 'Actualiza tu contraseña' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.changePassword);
    });
  });
});
