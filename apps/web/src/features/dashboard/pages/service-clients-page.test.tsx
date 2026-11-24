import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES, serviceClientsPath } from '../../../app/routes';
import { apiError, FULL_SESSION, mockSession, TEMPORARY_SESSION } from '../../../test/api-handlers';
import { pause } from '../../../test/pause';
import { renderApp } from '../../../test/render-app';
import { createClientsHandler, DESIGN_SERVICES, server } from '../../../test/server';

const CLIENTS_PATH = '*/api/services/:serviceId/clients';
const PAY = DESIGN_SERVICES[0]!;

async function openClients(search = '') {
  mockSession(FULL_SESSION);
  const rendered = await renderApp(`${serviceClientsPath(PAY.id)}${search}`);
  await screen.findByRole('heading', { level: 2, name: 'Adamo Pay' });
  return rendered;
}

function rowNames() {
  return screen.getAllByRole('rowheader').map((cell) => cell.textContent);
}

function lastRequestUrl(requests: URL[]) {
  return requests[requests.length - 1]!;
}

function recordRequests() {
  const requests: URL[] = [];
  const handler = createClientsHandler(45);
  server.use(
    http.get(CLIENTS_PATH, (info) => {
      requests.push(new URL(info.request.url));
      return handler.run(info).then((result) => result?.response ?? HttpResponse.json({}));
    }),
  );
  return requests;
}

describe('ServiceClientsPage', () => {
  describe('contenido', () => {
    it('muestra el nombre del servicio, su color y la primera página de 20 clientes', async () => {
      await openClients();

      expect(screen.getByTestId('service-accent')).toHaveStyle({ backgroundColor: '#0e9384' });
      expect(rowNames()).toHaveLength(20);
      expect(rowNames()[0]).toBe('Cliente 001');
      expect(rowNames()[19]).toBe('Cliente 020');
    });

    it('conserva el título Clientes y un enlace para volver a los servicios', async () => {
      await openClients();

      expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a servicios' })).toHaveAttribute(
        'href',
        ROUTES.clients,
      );
    });

    it('el menú de Clientes sigue marcado como la página actual en esta pantalla', async () => {
      await openClients();

      const sidebar = within(screen.getByRole('complementary'));
      expect(sidebar.getByRole('link', { name: 'Clientes' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('en móvil la pestaña Clientes sigue activa en esta pantalla', async () => {
      await openClients();

      const mobileNav = within(screen.getByRole('navigation', { name: 'Principal (móvil)' }));
      expect(mobileNav.getByRole('link', { name: 'Clientes' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('navigation', { name: 'Principal (móvil)' })).toHaveAttribute(
        'data-active-tab',
        'clients',
      );
    });

    it('resume el rango y la página', async () => {
      await openClients();

      expect(screen.getByText('1–20 de 45 clientes')).toBeInTheDocument();
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    });
  });

  describe('paginación', () => {
    it('"Siguiente" muestra la página 2 y lo guarda en la URL', async () => {
      const { router } = await openClients();

      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));
      expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
      expect(router.state.location.search).toBe('?page=2');
    });

    it('la última página muestra solo los que sobran y bloquea "Siguiente"', async () => {
      await openClients('?page=3');

      await waitFor(() => expect(rowNames()).toHaveLength(5));
      expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    });

    it('"Anterior" vuelve a la página anterior', async () => {
      await openClients('?page=2');
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));

      await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));

      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 001'));
    });

    it('el botón "atrás" del navegador regresa a la página anterior', async () => {
      const { router } = await openClients();
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));

      await router.navigate(-1);

      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 001'));
    });

    it('en la primera página "Anterior" está deshabilitado', async () => {
      await openClients();

      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    });

    it('una página inexistente en la URL se corrige a la última', async () => {
      const { router } = await openClients('?page=99');

      await waitFor(() => expect(router.state.location.search).toBe('?page=3'));
      await waitFor(() => expect(rowNames()).toHaveLength(5));
    });

    it.each(['?page=abc', '?page=0', '?page=-2', '?page=1.5'])(
      'una página inválida en la URL (%s) se trata como la primera',
      async (search) => {
        await openClients(search);

        expect(rowNames()[0]).toBe('Cliente 001');
      },
    );

    it('pide a la API 20 clientes por página', async () => {
      const requests = recordRequests();
      await openClients();

      expect(lastRequestUrl(requests).searchParams.get('pageSize')).toBe('20');
    });

    it('cambiar de página o buscar no vuelve a verificar la sesión ni cambia a la pantalla de carga general', async () => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () => {
          sessionChecks += 1;
          return HttpResponse.json({ session: FULL_SESSION });
        }),
      );
      await renderApp(serviceClientsPath(PAY.id));
      await screen.findByRole('table');
      const checksBefore = sessionChecks;

      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));
      await userEvent.type(screen.getByRole('searchbox'), '03');
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 003'));

      expect(sessionChecks).toBe(checksBefore);
    });

    it('mientras carga la siguiente página conserva la anterior, la marca como ocupada y muestra el spinner', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '0');
      await openClients();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const handler = createClientsHandler(45);
      server.use(
        http.get(CLIENTS_PATH, async (info) => {
          await gate;
          return (await handler.run(info))!.response!;
        }),
      );

      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

      expect(rowNames()[0]).toBe('Cliente 001');
      expect(document.querySelector('svg.animate-spin')).toBeInTheDocument();
      expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');

      release();
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));
      expect(document.querySelector('svg.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('búsqueda', () => {
    it('espera a que dejes de escribir y entonces filtra, guardando el texto en la URL', async () => {
      const { router } = await openClients();

      await userEvent.type(
        screen.getByRole('searchbox', { name: 'Buscar clientes' }),
        'cliente 04',
      );

      await waitFor(() => expect(rowNames()).toHaveLength(6));
      expect(rowNames()[0]).toBe('Cliente 040');
      expect(router.state.location.search).toBe('?q=cliente+04');
    });

    it('no pide a la API una vez por cada letra', async () => {
      const requests = recordRequests();
      await openClients();
      const before = requests.length;

      await userEvent.type(screen.getByRole('searchbox'), 'cliente 04');
      await waitFor(() => expect(rowNames()).toHaveLength(6));

      expect(requests.length - before).toBeLessThanOrEqual(2);
    });

    it('envía la búsqueda a la API', async () => {
      const requests = recordRequests();
      await openClients();

      await userEvent.type(screen.getByRole('searchbox'), 'ana');
      await waitFor(() => expect(lastRequestUrl(requests).searchParams.get('search')).toBe('ana'));
    });

    it('al buscar vuelve a la primera página', async () => {
      const { router } = await openClients('?page=2');
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 021'));

      await userEvent.type(screen.getByRole('searchbox'), '03');

      await waitFor(() => expect(router.state.location.search).toBe('?q=03'));
      await waitFor(() => expect(rowNames()[0]).toBe('Cliente 003'));
    });

    it('al abrir con ?q= la caja ya trae el texto y la lista ya viene filtrada', async () => {
      await openClients('?q=cliente044');

      expect(screen.getByRole('searchbox')).toHaveValue('cliente044');
      expect(rowNames()).toEqual(['Cliente 044']);
    });

    it('sin coincidencias lo dice con el texto buscado', async () => {
      await openClients();

      await userEvent.type(screen.getByRole('searchbox'), 'zzzz');

      expect(
        await screen.findByText('No encontramos clientes que coincidan con "zzzz".'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Paginación de clientes' })).toBeNull();
    });

    it('al borrar la búsqueda vuelve la lista completa y se limpia la URL', async () => {
      const { router } = await openClients('?q=zzzz');
      await screen.findByText(/No encontramos clientes/);

      await userEvent.clear(screen.getByRole('searchbox'));

      await waitFor(() => expect(rowNames()).toHaveLength(20));
      expect(router.state.location.search).toBe('');
    });

    it('ignora los espacios de los extremos', async () => {
      const { router } = await openClients();

      await userEvent.type(screen.getByRole('searchbox'), '  cliente044  ');

      await waitFor(() => expect(rowNames()).toEqual(['Cliente 044']));
      expect(router.state.location.search).toBe('?q=cliente044');
    });

    it('limita lo que se puede escribir a 100 caracteres', async () => {
      await openClients();

      expect(screen.getByRole('searchbox')).toHaveAttribute('maxlength', '100');
    });

    it('no pierde el foco mientras se busca', async () => {
      await openClients();
      const search = screen.getByRole('searchbox');

      await userEvent.type(search, 'cliente 04');
      await waitFor(() => expect(rowNames()).toHaveLength(6));

      expect(search).toHaveFocus();
    });
  });

  describe('estados', () => {
    it('muestra un spinner mientras carga y la zona ocupada', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '0');
      mockSession(FULL_SESSION);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const handler = createClientsHandler(45);
      server.use(
        http.get(CLIENTS_PATH, async (info) => {
          await gate;
          return (await handler.run(info))!.response!;
        }),
      );

      await renderApp(serviceClientsPath(PAY.id));

      expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(
        'Cargando clientes',
      );
      release();
      await screen.findByRole('table');
      expect(screen.queryByText('Cargando clientes')).not.toBeInTheDocument();
    });

    it('mantiene el spinner el tiempo mínimo aunque el servidor responda al instante', async () => {
      vi.stubEnv('VITE_MIN_LOADING_MS', '1500');
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath(PAY.id));
      await screen.findByText('Cargando clientes');
      await pause(100);

      expect(screen.getByText('Cargando clientes')).toBeInTheDocument();
      expect(await screen.findByRole('table')).toBeInTheDocument();
    });

    it('un servicio sin clientes lo dice y no muestra paginación', async () => {
      server.use(createClientsHandler(0));
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath(PAY.id));

      expect(
        await screen.findByText('Este servicio todavía no tiene clientes.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Paginación de clientes' })).toBeNull();
    });

    it('un servicio que no existe muestra un aviso, sin buscador, y permite volver', async () => {
      server.use(
        http.get(CLIENTS_PATH, () => apiError(404, 'SERVICE_NOT_FOUND', 'Servicio no encontrado')),
      );
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath('inexistente'));

      expect(
        await screen.findByText('Este servicio no existe o ya no está disponible.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver a servicios' })).toBeInTheDocument();
    });

    it('un id con caracteres especiales viaja codificado en la petición', async () => {
      const requested: string[] = [];
      server.use(
        http.get(CLIENTS_PATH, ({ request }) => {
          requested.push(new URL(request.url).pathname);
          return apiError(404, 'SERVICE_NOT_FOUND', 'x');
        }),
      );
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath('a/b ñ'));

      await screen.findByText('Este servicio no existe o ya no está disponible.');
      expect(requested[0]).toBe('/api/services/a%2Fb%20%C3%B1/clients');
    });

    it('si el servidor falla muestra un mensaje genérico y permite reintentar', async () => {
      server.use(http.get(CLIENTS_PATH, () => apiError(500, 'INTERNAL', 'detalle interno')));
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath(PAY.id));

      expect(await screen.findByText(/Tuvimos un problema en el servidor/)).toBeInTheDocument();
      expect(screen.queryByText('detalle interno')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    });

    it('"Reintentar" vuelve a pedir los clientes y los muestra cuando el servidor ya responde', async () => {
      let calls = 0;
      const handler = createClientsHandler(45);
      server.use(
        http.get(CLIENTS_PATH, async (info) => {
          calls += 1;
          return calls === 1
            ? apiError(500, 'INTERNAL', 'x')
            : (await handler.run(info))!.response!;
        }),
      );
      mockSession(FULL_SESSION);
      await renderApp(serviceClientsPath(PAY.id));

      await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByRole('table')).toBeInTheDocument();
      expect(calls).toBe(2);
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.get(CLIENTS_PATH, () => HttpResponse.error()));
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath(PAY.id));

      expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument();
    });

    it('si la respuesta tiene datos inválidos no muestra la tabla, solo un error', async () => {
      server.use(http.get(CLIENTS_PATH, () => HttpResponse.json({ clients: 'mal' })));
      mockSession(FULL_SESSION);

      await renderApp(serviceClientsPath(PAY.id));

      expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('con un 401 lleva al inicio de sesión', async () => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ session: ++sessionChecks === 1 ? FULL_SESSION : null }),
        ),
        http.get(CLIENTS_PATH, () => apiError(401, 'UNAUTHENTICATED', 'x')),
      );

      const { router } = await renderApp(serviceClientsPath(PAY.id));

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });
  });

  describe('acceso', () => {
    it('sin sesión lleva a iniciar sesión', async () => {
      mockSession(null);

      const { router } = await renderApp(serviceClientsPath(PAY.id));

      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('con la contraseña temporal sin cambiar lleva a cambiarla', async () => {
      mockSession(TEMPORARY_SESSION);

      const { router } = await renderApp(serviceClientsPath(PAY.id));

      expect(router.state.location.pathname).toBe(ROUTES.changePassword);
    });
  });

  describe('desde las tarjetas', () => {
    it('"Gestionar clientes" abre la lista de ese servicio', async () => {
      mockSession(FULL_SESSION);
      const { router } = await renderApp(ROUTES.clients);
      const cards = await screen.findAllByRole('article');

      await userEvent.click(within(cards[1]!).getByRole('link', { name: /Gestionar clientes/ }));

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`${ROUTES.clients}/${DESIGN_SERVICES[1]!.id}`),
      );
      expect(await screen.findByRole('table')).toBeInTheDocument();
    });

    it('"Volver a servicios" regresa a las tarjetas', async () => {
      const { router } = await openClients();

      await userEvent.click(screen.getByRole('link', { name: 'Volver a servicios' }));

      await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.clients));
      expect(await screen.findAllByRole('article')).toHaveLength(4);
    });
  });
});
