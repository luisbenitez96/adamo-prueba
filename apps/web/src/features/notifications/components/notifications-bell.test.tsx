import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../../app/routes';
import { apiError, FULL_SESSION, mockSession } from '../../../test/api-handlers';
import { renderApp } from '../../../test/render-app';
import { renderWithProviders } from '../../../test/render-with-providers';
import { DESIGN_NOTIFICATIONS, server } from '../../../test/server';
import { NotificationsBell } from './notifications-bell';

const NOTIFICATIONS_PATH = '*/api/notifications';

function respondWith(notifications: typeof DESIGN_NOTIFICATIONS, unreadCount: number) {
  server.use(http.get(NOTIFICATIONS_PATH, () => HttpResponse.json({ notifications, unreadCount })));
}

function bell() {
  return screen.getByRole('button', { name: /^Notificaciones/ });
}

async function renderBell() {
  const rendered = renderWithProviders(<NotificationsBell />);
  await screen.findByRole('button', { name: /^Notificaciones/ });
  return rendered;
}

async function openPanel() {
  await renderBell();
  await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones (2 sin leer)'));
  await userEvent.click(bell());
  return screen.getByRole('region', { name: 'Panel de notificaciones' });
}

describe('NotificationsBell', () => {
  describe('el botón', () => {
    it('con notificaciones sin leer muestra el punto rojo y dice cuántas hay', async () => {
      await renderBell();

      expect(await screen.findByTestId('unread-dot')).toHaveAttribute('aria-hidden', 'true');
      expect(bell()).toHaveAccessibleName('Notificaciones (2 sin leer)');
    });

    it('si todas están leídas no hay punto rojo y el nombre queda simple', async () => {
      respondWith(
        DESIGN_NOTIFICATIONS.map((item) => ({ ...item, read: true })),
        0,
      );
      await renderBell();

      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones'));
      expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument();
    });

    it('sin notificaciones no hay punto rojo', async () => {
      respondWith([], 0);
      await renderBell();

      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones'));
      expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument();
    });

    it('empieza cerrada y anuncia su estado', async () => {
      await renderBell();

      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('region', { name: 'Panel de notificaciones' })).toBeNull();
    });
  });

  describe('el panel', () => {
    it('se abre al pulsar la campana y el botón queda enlazado con él', async () => {
      const panel = await openPanel();

      expect(bell()).toHaveAttribute('aria-expanded', 'true');
      expect(bell()).toHaveAttribute('aria-controls', panel.id);
      expect(within(panel).getByRole('heading', { name: 'Notificaciones' })).toBeInTheDocument();
    });

    it('lista las notificaciones, las más recientes primero, con su hora relativa', async () => {
      const panel = await openPanel();

      const items = within(panel).getAllByRole('listitem');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('Cambiaste tu contraseña');
      expect(items[0]).toHaveTextContent('hace 5 minutos');
      expect(items[1]).toHaveTextContent('hace 2 horas');
      expect(items[2]).toHaveTextContent('hace 3 días');
    });

    it('al pulsar la campana otra vez se cierra', async () => {
      await openPanel();

      await userEvent.click(bell());

      expect(screen.queryByRole('region', { name: 'Panel de notificaciones' })).toBeNull();
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
    });

    it('Escape lo cierra y devuelve el foco a la campana, aunque el foco estuviera dentro del panel', async () => {
      const panel = await openPanel();
      within(panel).getByRole('button', { name: 'Cerrar notificaciones' }).focus();
      expect(bell()).not.toHaveFocus();

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('region', { name: 'Panel de notificaciones' })).toBeNull();
      expect(bell()).toHaveFocus();
    });

    it('hacer clic fuera lo cierra', async () => {
      await openPanel();

      await userEvent.click(document.body);

      expect(screen.queryByRole('region', { name: 'Panel de notificaciones' })).toBeNull();
    });

    it('hacer clic dentro del panel no lo cierra', async () => {
      const panel = await openPanel();

      await userEvent.click(within(panel).getByRole('heading', { name: 'Notificaciones' }));

      expect(screen.getByRole('region', { name: 'Panel de notificaciones' })).toBeInTheDocument();
    });

    it('el botón de cierre lo cierra y devuelve el foco a la campana', async () => {
      const panel = await openPanel();

      await userEvent.click(within(panel).getByRole('button', { name: 'Cerrar notificaciones' }));

      expect(screen.queryByRole('region', { name: 'Panel de notificaciones' })).toBeNull();
      expect(bell()).toHaveFocus();
    });

    it('cerrado, Escape y los clics fuera no hacen nada raro', async () => {
      await renderBell();

      await userEvent.keyboard('{Escape}');
      await userEvent.click(document.body);

      expect(bell()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('marcar como leídas', () => {
    it('pulsar una no leída la marca y baja el contador', async () => {
      const state = DESIGN_NOTIFICATIONS.map((item) => ({ ...item }));
      let unread = 2;
      server.use(
        http.get(NOTIFICATIONS_PATH, () =>
          HttpResponse.json({ notifications: state, unreadCount: unread }),
        ),
        http.post('*/api/notifications/:id/read', ({ params }) => {
          state.find((item) => item.id === params.id)!.read = true;
          unread -= 1;
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const panel = await openPanel();

      await userEvent.click(within(panel).getByRole('button', { name: /Cambiaste tu contraseña/ }));

      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones (1 sin leer)'));
      expect(within(panel).queryByRole('button', { name: /Cambiaste tu contraseña/ })).toBeNull();
      expect(within(panel).getByRole('button', { name: /Iniciaste sesión/ })).toBeInTheDocument();
    });

    it('"Marcar todas como leídas" las marca todas y quita el punto rojo', async () => {
      let allRead = false;
      server.use(
        http.get(NOTIFICATIONS_PATH, () =>
          HttpResponse.json({
            notifications: DESIGN_NOTIFICATIONS.map((item) => ({
              ...item,
              read: allRead || item.read,
            })),
            unreadCount: allRead ? 0 : 2,
          }),
        ),
        http.post('*/api/notifications/read', () => {
          allRead = true;
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const panel = await openPanel();

      await userEvent.click(
        within(panel).getByRole('button', { name: 'Marcar todas como leídas' }),
      );

      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones'));
      expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument();
      expect(
        within(panel).getByRole('button', { name: 'Marcar todas como leídas' }),
      ).toBeDisabled();
    });

    it('si no hay nada sin leer, "Marcar todas" está deshabilitado', async () => {
      respondWith(
        DESIGN_NOTIFICATIONS.map((item) => ({ ...item, read: true })),
        0,
      );
      await renderBell();
      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones'));
      await userEvent.click(bell());

      expect(screen.getByRole('button', { name: 'Marcar todas como leídas' })).toBeDisabled();
    });

    it('si falla al marcar, lo dice sin detalles internos y no cambia nada', async () => {
      server.use(
        http.post('*/api/notifications/:id/read', () =>
          apiError(500, 'INTERNAL', 'detalle interno'),
        ),
      );
      const panel = await openPanel();

      await userEvent.click(within(panel).getByRole('button', { name: /Cambiaste tu contraseña/ }));

      expect(
        await within(panel).findByText(/Tuvimos un problema en el servidor/),
      ).toBeInTheDocument();
      expect(within(panel).queryByText('detalle interno')).not.toBeInTheDocument();
      expect(bell()).toHaveAccessibleName('Notificaciones (2 sin leer)');
    });
  });

  describe('estados', () => {
    it('sin notificaciones lo dice', async () => {
      respondWith([], 0);
      await renderBell();
      await waitFor(() => expect(bell()).toHaveAccessibleName('Notificaciones'));

      await userEvent.click(bell());

      expect(screen.getByText('No tienes notificaciones.')).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('mientras carga por primera vez muestra un spinner', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      server.use(
        http.get(NOTIFICATIONS_PATH, async () => {
          await gate;
          return HttpResponse.json({ notifications: DESIGN_NOTIFICATIONS, unreadCount: 2 });
        }),
      );
      await renderBell();

      await userEvent.click(bell());

      expect(screen.getByText('Cargando notificaciones')).toBeInTheDocument();
      release();
      expect(await screen.findAllByRole('listitem')).toHaveLength(3);
      expect(screen.queryByText('Cargando notificaciones')).not.toBeInTheDocument();
    });

    it('al abrir el panel con un error previo, se reintenta solo y muestra la lista', async () => {
      let calls = 0;
      server.use(
        http.get(NOTIFICATIONS_PATH, () => {
          calls += 1;
          return calls === 1
            ? apiError(500, 'INTERNAL', 'x')
            : HttpResponse.json({ notifications: DESIGN_NOTIFICATIONS, unreadCount: 2 });
        }),
      );
      await renderBell();
      await waitFor(() => expect(calls).toBe(1));

      await userEvent.click(bell());

      expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    });

    it('si falla la carga muestra el error y permite reintentar', async () => {
      let calls = 0;
      server.use(
        http.get(NOTIFICATIONS_PATH, () => {
          calls += 1;
          return calls <= 2
            ? apiError(500, 'INTERNAL', 'x')
            : HttpResponse.json({ notifications: DESIGN_NOTIFICATIONS, unreadCount: 2 });
        }),
      );
      await renderBell();
      await userEvent.click(bell());

      await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));

      expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    });

    it('si no hay conexión lo dice', async () => {
      server.use(http.get(NOTIFICATIONS_PATH, () => HttpResponse.error()));
      await renderBell();

      await userEvent.click(bell());

      expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument();
    });

    it('datos inválidos del servidor no se muestran, solo el error', async () => {
      server.use(http.get(NOTIFICATIONS_PATH, () => HttpResponse.json({ notifications: 'mal' })));
      await renderBell();

      await userEvent.click(bell());

      expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('sesión', () => {
    it('con un 401 lleva al inicio de sesión', async () => {
      let sessionChecks = 0;
      server.use(
        http.get('*/api/auth/me', () =>
          HttpResponse.json({ session: ++sessionChecks === 1 ? FULL_SESSION : null }),
        ),
        http.get(NOTIFICATIONS_PATH, () => apiError(401, 'UNAUTHENTICATED', 'x')),
      );

      const { router } = await renderApp(ROUTES.home);

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe(ROUTES.login);
    });

    it('la campana está en todas las pantallas del dashboard', async () => {
      mockSession(FULL_SESSION);

      const { router } = await renderApp(ROUTES.clients);
      await screen.findByRole('heading', { level: 1, name: 'Clientes' });
      expect(await screen.findByRole('button', { name: /^Notificaciones/ })).toBeInTheDocument();

      await router.navigate(ROUTES.home);
      await screen.findByRole('heading', { level: 1, name: 'Inicio' });
      expect(await screen.findByRole('button', { name: /^Notificaciones/ })).toBeInTheDocument();
    });
  });
});
