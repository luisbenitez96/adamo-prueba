import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES, serviceClientsPath } from '../../../app/routes';
import { apiError, FULL_SESSION, mockSession, TEMPORARY_SESSION } from '../../../test/api-handlers';
import { pause } from '../../../test/pause';
import { renderApp } from '../../../test/render-app';
import { DESIGN_SERVICES, DESIGN_SUMMARY, server } from '../../../test/server';

const SUMMARY_PATH = '*/api/summary';
const SERVICES_PATH = '*/api/services';

function main() {
  return within(screen.getByRole('main'));
}

async function openHome() {
  mockSession({ ...FULL_SESSION, email: 'luis@correo.com' });
  const rendered = await renderApp(ROUTES.home);
  await screen.findByRole('heading', { level: 1, name: 'Inicio' });
  return rendered;
}

describe('HomePage', () => {
  describe('contenido', () => {
    it('da la bienvenida con el correo de la sesión', async () => {
      await openHome();

      expect(screen.getByRole('heading', { name: 'Te damos la bienvenida' })).toBeInTheDocument();
      expect(main().getByText('luis@correo.com')).toBeInTheDocument();
    });

    it('muestra las 4 tarjetas del resumen con los datos reales de la API', async () => {
      await openHome();

      const total = await screen.findByRole('article', { name: 'Clientes totales' });
      expect(total).toHaveTextContent('16.769');
      expect(total).toHaveTextContent('En 4 servicios');
      expect(screen.getByRole('article', { name: 'Activos' })).toHaveTextContent('11.738');
      expect(screen.getByRole('article', { name: 'Pendientes' })).toHaveTextContent('3.354');
      expect(screen.getByRole('article', { name: 'Inactivos' })).toHaveTextContent('1.677');
    });

    it('cada estado indica qué porcentaje del total representa', async () => {
      await openHome();

      expect(await screen.findByRole('article', { name: 'Activos' })).toHaveTextContent(
        '70 % del total',
      );
      expect(screen.getByRole('article', { name: 'Pendientes' })).toHaveTextContent(
        '20 % del total',
      );
      expect(screen.getByRole('article', { name: 'Inactivos' })).toHaveTextContent(
        '10 % del total',
      );
    });

    it('con un solo servicio la nota va en singular', async () => {
      server.use(
        http.get(SUMMARY_PATH, () =>
          HttpResponse.json({ summary: { ...DESIGN_SUMMARY, totalServices: 1 } }),
        ),
      );
      await openHome();

      expect(await screen.findByRole('article', { name: 'Clientes totales' })).toHaveTextContent(
        'En 1 servicio',
      );
    });

    it('lista los 4 servicios en orden, con su descripción, color y cantidad de clientes', async () => {
      await openHome();

      const items = await main().findAllByRole('listitem');

      expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual([
        'Adamo Pay',
        'Adamo ID',
        'Adamo Risk',
        'Adamo Sign',
      ]);
      expect(within(items[0]!).getByText('Gestión de pagos')).toBeInTheDocument();
      expect(within(items[0]!).getByText('3.827 clientes')).toBeInTheDocument();
      expect(within(items[2]!).getByText('793 clientes')).toBeInTheDocument();
      expect(within(items[2]!).getByTestId('service-dot')).toHaveStyle({
        backgroundColor: '#7839ee',
      });
    });
  });

  describe('navegación', () => {
    it('"Ver clientes" abre la lista de ese servicio', async () => {
      const { router } = await openHome();
      const items = await main().findAllByRole('listitem');

      await userEvent.click(
        within(items[1]!).getByRole('link', { name: 'Ver clientes de Adamo ID' }),
      );

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(serviceClientsPath(DESIGN_SERVICES[1]!.id)),
      );
      expect(await screen.findByRole('table')).toBeInTheDocument();
    });

    it('"Ir a la gestión de clientes" lleva a las tarjetas de servicios', async () => {
      const { router } = await openHome();

      await userEvent.click(screen.getByRole('link', { name: 'Ir a la gestión de clientes' }));

      await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.clients));
      expect(await screen.findAllByRole('article')).toHaveLength(4);
    });

    it('desde Clientes, "Inicio" del menú vuelve aquí', async () => {
      mockSession(FULL_SESSION);
      const { router } = await renderApp(ROUTES.clients);
      await screen.findByRole('heading', { level: 1, name: 'Clientes' });

      await userEvent.click(
        within(screen.getByRole('complementary')).getByRole('link', { name: 'Inicio' }),
      );

      await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.home));
      expect(await screen.findByRole('article', { name: 'Clientes totales' })).toBeInTheDocument();
    });
  });

  describe('carga y errores', () => {
    it('muestra spinners mientras carga el resumen y los servicios', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '0');
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.get(SUMMARY_PATH, async () => {
          await gate;
          return HttpResponse.json({ summary: DESIGN_SUMMARY });
        }),
        http.get(SERVICES_PATH, async () => {
          await gate;
          return HttpResponse.json({ services: DESIGN_SERVICES });
        }),
      );

      mockSession(FULL_SESSION);
      await renderApp(ROUTES.home);

      expect(await screen.findByText('Cargando resumen')).toBeInTheDocument();
      expect(screen.getByText('Cargando servicios')).toBeInTheDocument();
      release();
      await screen.findByRole('article', { name: 'Clientes totales' });
      expect(screen.queryByText('Cargando resumen')).not.toBeInTheDocument();
      expect(screen.queryByText('Cargando servicios')).not.toBeInTheDocument();
    });

    it('mantiene el spinner el tiempo mínimo aunque el servidor responda al instante', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '1500');
      mockSession(FULL_SESSION);

      await renderApp(ROUTES.home);
      await screen.findByText('Cargando resumen');
      await pause(100);

      expect(screen.getByText('Cargando resumen')).toBeInTheDocument();
      expect(await screen.findByRole('article', { name: 'Clientes totales' })).toBeInTheDocument();
    });

    it('si falla el resumen, los servicios se siguen mostrando y se puede reintentar solo el resumen', async () => {
      server.use(http.get(SUMMARY_PATH, () => apiError(500, 'INTERNAL', 'detalle interno')));
      await openHome();

      expect(await screen.findByText(/Tuvimos un problema en el servidor/)).toBeInTheDocument();
      expect(screen.queryByText('detalle interno')).not.toBeInTheDocument();
      expect(await main().findAllByRole('listitem')).toHaveLength(4);
      expect(screen.getAllByRole('button', { name: 'Reintentar' })).toHaveLength(1);
    });

    it('si fallan los servicios, el resumen se sigue mostrando', async () => {
      server.use(http.get(SERVICES_PATH, () => apiError(500, 'INTERNAL', 'x')));
      await openHome();

      expect(await screen.findByRole('article', { name: 'Clientes totales' })).toBeInTheDocument();
      expect(await screen.findByText(/Tuvimos un problema en el servidor/)).toBeInTheDocument();
      expect(main().queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('"Reintentar" vuelve a pedir el resumen y lo muestra cuando el servidor ya responde', async () => {
      let calls = 0;
      server.use(
        http.get(SUMMARY_PATH, () => {
          calls += 1;
          return calls === 1
            ? apiError(500, 'INTERNAL', 'x')
            : HttpResponse.json({ summary: DESIGN_SUMMARY });
        }),
      );
      await openHome();

      await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByRole('article', { name: 'Clientes totales' })).toBeInTheDocument();
      expect(calls).toBe(2);
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.get(SUMMARY_PATH, () => HttpResponse.error()));
      await openHome();

      expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument();
    });

    it('un resumen con datos inválidos no muestra tarjetas, solo el error', async () => {
      server.use(
        http.get(SUMMARY_PATH, () => HttpResponse.json({ summary: { totalClients: 'x' } })),
      );
      await openHome();

      expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
      expect(screen.queryByRole('article', { name: 'Clientes totales' })).not.toBeInTheDocument();
    });

    it('sin servicios lo dice', async () => {
      server.use(http.get(SERVICES_PATH, () => HttpResponse.json({ services: [] })));
      await openHome();

      expect(await screen.findByText('Todavía no hay servicios disponibles.')).toBeInTheDocument();
    });

    it.each([
      ['el resumen', SUMMARY_PATH],
      ['los servicios', SERVICES_PATH],
    ])('con un 401 en %s lleva al inicio de sesión', async (_name, path) => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ session: ++sessionChecks === 1 ? FULL_SESSION : null }),
        ),
        http.get(path, () => apiError(401, 'UNAUTHENTICATED', 'x')),
      );

      const { router } = await renderApp(ROUTES.home);

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });
  });

  describe('acceso', () => {
    it('sin sesión lleva a iniciar sesión', async () => {
      mockSession(null);

      const { router } = await renderApp(ROUTES.home);

      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('con la contraseña temporal sin cambiar lleva a cambiarla', async () => {
      mockSession(TEMPORARY_SESSION);

      const { router } = await renderApp(ROUTES.home);

      expect(router.state.location.pathname).toBe(ROUTES.changePassword);
    });
  });
});
