import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ROUTES } from '../app/routes';
import { FULL_SESSION, mockSession } from '../test/api-handlers';
import { renderApp } from '../test/render-app';
import { server } from '../test/server';

async function openDashboard() {
  mockSession(FULL_SESSION);
  const rendered = await renderApp(ROUTES.dashboard);
  await screen.findByRole('heading', { level: 1, name: 'Clientes' });
  return rendered;
}

const openMenuButton = () => screen.getByRole('button', { name: 'Abrir menú' });

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

  it('el menú móvil abierto queda fuera de la rejilla de la página', async () => {
    await openDashboard();
    await userEvent.click(openMenuButton());

    expect(screen.getByRole('main').parentElement).not.toContainElement(screen.getByRole('dialog'));
  });

  describe('menú en pantallas pequeñas', () => {
    it('empieza cerrado, con el botón que lo abre indicando su estado', async () => {
      await openDashboard();

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(openMenuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('el botón lo abre y muestra la misma navegación', async () => {
      await openDashboard();

      await userEvent.click(openMenuButton());

      const dialog = screen.getByRole('dialog', { name: 'Menú de navegación' });
      expect(within(dialog).getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
      expect(openMenuButton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('se cierra con el botón Cerrar menú y devuelve el foco al botón que lo abrió', async () => {
      await openDashboard();
      await userEvent.click(openMenuButton());

      await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(openMenuButton()).toHaveFocus();
      expect(openMenuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('se cierra con la tecla Escape', async () => {
      await openDashboard();
      await userEvent.click(openMenuButton());

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('al elegir una opción de navegación se cierra solo', async () => {
      await openDashboard();
      await userEvent.click(openMenuButton());
      const dialog = screen.getByRole('dialog');

      await userEvent.click(within(dialog).getByRole('link', { name: 'Clientes' }));

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('cerrar sesión desde el menú móvil también funciona', async () => {
      server.use(
        http.post('*/api/auth/logout', () => {
          mockSession(null);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      await openDashboard();
      await userEvent.click(openMenuButton());

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar sesión' }),
      );

      expect(
        await screen.findByRole('heading', { name: 'Inicia sesión en tu cuenta de AdamoServices' }),
      ).toBeInTheDocument();
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
