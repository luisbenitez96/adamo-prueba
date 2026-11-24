import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../app/routes';
import { FULL_SESSION, mockSession } from '../test/api-handlers';
import { renderApp } from '../test/render-app';
import { server } from '../test/server';

async function openDashboard() {
  mockSession({ ...FULL_SESSION, email: 'ana@correo.com' });
  const rendered = await renderApp(ROUTES.clients);
  await screen.findByRole('heading', { level: 1, name: 'Clientes' });
  return rendered;
}

const mobileNav = () => screen.getByRole('navigation', { name: 'Principal (móvil)' });
const moreButton = () => within(mobileNav()).getByRole('button', { name: 'Más' });
const moreSheet = () => screen.getByRole('group', { name: 'Más opciones', hidden: true });

describe('DashboardLayout', () => {
  it('muestra el menú lateral y el contenido principal', async () => {
    await openDashboard();

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { level: 1, name: 'Clientes' }),
    );
  });

  it('el contenido principal no está dentro del menú lateral', async () => {
    await openDashboard();

    expect(screen.getByRole('complementary')).not.toContainElement(screen.getByRole('main'));
  });

  it('la rejilla de la página solo tiene tres hijos: menú lateral, barra móvil y contenido (un hijo de más rompe las columnas)', async () => {
    await openDashboard();

    const grid = screen.getByRole('main').parentElement!;

    expect(Array.from(grid.children).map((child) => child.tagName)).toEqual([
      'ASIDE',
      'DIV',
      'MAIN',
    ]);
  });

  it('la barra inferior y la hoja "Más" quedan fuera de la rejilla de la página', async () => {
    await openDashboard();

    const grid = screen.getByRole('main').parentElement!;

    expect(grid).not.toContainElement(mobileNav());
    expect(grid).not.toContainElement(moreSheet());
  });

  it('ya no hay botón de menú hamburguesa', async () => {
    await openDashboard();

    expect(screen.queryByRole('button', { name: 'Abrir menú' })).toBeNull();
  });

  describe('barra de navegación inferior (pantallas pequeñas)', () => {
    it('tiene tres pestañas: Inicio, Clientes y Más', async () => {
      await openDashboard();

      const nav = within(mobileNav());
      expect(nav.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
      expect(nav.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
      expect(nav.getByRole('button', { name: 'Más' })).toBeInTheDocument();
    });

    it('Clientes se marca como la página actual y es la pestaña activa', async () => {
      await openDashboard();

      expect(within(mobileNav()).getByRole('link', { name: 'Clientes' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(mobileNav()).toHaveAttribute('data-active-tab', 'clients');
    });

    it('en Clientes, la pestaña Inicio no se marca como la página actual', async () => {
      await openDashboard();

      expect(within(mobileNav()).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('Inicio lleva a la pantalla de inicio y pasa a ser la pestaña activa', async () => {
      const { router } = await openDashboard();

      await userEvent.click(within(mobileNav()).getByRole('link', { name: 'Inicio' }));

      await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.home));
      expect(await screen.findByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
      expect(within(mobileNav()).getByRole('link', { name: 'Inicio' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(mobileNav()).getByRole('link', { name: 'Clientes' })).not.toHaveAttribute(
        'aria-current',
      );
      expect(mobileNav()).toHaveAttribute('data-active-tab', 'home');
    });

    it('la hoja "Más" empieza cerrada: inerte para el teclado y los lectores de pantalla', async () => {
      await openDashboard();

      expect(moreSheet()).toHaveAttribute('inert');
      expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('el botón Más controla la hoja: su aria-controls es el id real de la hoja', async () => {
      await openDashboard();

      expect(moreSheet().id).not.toBe('');
      expect(moreButton()).toHaveAttribute('aria-controls', moreSheet().id);
    });

    describe('al abrir "Más"', () => {
      it('muestra la hoja con el perfil, el correo y Cerrar sesión', async () => {
        await openDashboard();

        await userEvent.click(moreButton());

        const sheet = within(moreSheet());
        expect(moreSheet()).not.toHaveAttribute('inert');
        expect(sheet.getByRole('button', { name: /Mi perfil/ })).toHaveTextContent(
          'ana@correo.com',
        );
        expect(sheet.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
      });

      it('la pestaña Más pasa a ser la activa y el botón indica que está expandido', async () => {
        await openDashboard();

        await userEvent.click(moreButton());

        expect(moreButton()).toHaveAttribute('aria-expanded', 'true');
        expect(mobileNav()).toHaveAttribute('data-active-tab', 'more');
      });

      it('lleva el foco al primer elemento de la hoja', async () => {
        await openDashboard();

        await userEvent.click(moreButton());

        expect(within(moreSheet()).getByRole('button', { name: /Mi perfil/ })).toHaveFocus();
      });

      it('el botón Más vuelve a cerrarla', async () => {
        await openDashboard();
        await userEvent.click(moreButton());

        await userEvent.click(moreButton());

        expect(moreSheet()).toHaveAttribute('inert');
        expect(mobileNav()).toHaveAttribute('data-active-tab', 'clients');
      });

      it('la tecla Escape la cierra y devuelve el foco al botón Más', async () => {
        await openDashboard();
        await userEvent.click(moreButton());

        await userEvent.keyboard('{Escape}');

        expect(moreSheet()).toHaveAttribute('inert');
        expect(moreButton()).toHaveFocus();
        expect(moreButton()).toHaveAttribute('aria-expanded', 'false');
      });

      it('tocar el fondo oscuro la cierra', async () => {
        await openDashboard();
        await userEvent.click(moreButton());

        await userEvent.click(document.querySelector('[role="presentation"]') as HTMLElement);

        expect(moreSheet()).toHaveAttribute('inert');
      });

      it('Escape no hace nada mientras está cerrada (no roba el foco)', async () => {
        await openDashboard();
        within(mobileNav()).getByRole('link', { name: 'Clientes' }).focus();

        await userEvent.keyboard('{Escape}');

        expect(moreButton()).not.toHaveFocus();
      });

      it('cerrar sesión desde la hoja funciona', async () => {
        server.use(
          http.post('*/api/auth/logout', () => {
            mockSession(null);
            return new HttpResponse(null, { status: 204 });
          }),
        );
        await openDashboard();
        await userEvent.click(moreButton());

        await userEvent.click(within(moreSheet()).getByRole('button', { name: 'Cerrar sesión' }));

        expect(
          await screen.findByRole('heading', {
            name: 'Inicia sesión en tu cuenta de AdamoServices',
          }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('al cambiar de pantalla', () => {
    it('muestra el spinner en la zona principal y luego la pantalla nueva', async () => {
      vi.stubEnv('VITE_MIN_NAVIGATION_MS', '300');
      server.use(
        http.post('*/api/auth/logout', () => {
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      await openDashboard();

      await userEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0]!);

      await waitFor(() => expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true'));
      expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Cargando');
      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
    });
  });
});
