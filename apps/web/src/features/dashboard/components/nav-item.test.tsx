import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { House } from 'lucide-react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { NavItem } from './nav-item';

function renderAt(path: string, element: React.ReactElement) {
  render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>);
}

describe('NavItem con destino', () => {
  it('es un enlace con su texto y su destino', () => {
    renderAt(
      '/',
      <NavItem icon={House} to="/dashboard/clientes">
        Clientes
      </NavItem>,
    );

    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute(
      'href',
      '/dashboard/clientes',
    );
  });

  it('se marca como la página actual cuando está en ese destino', () => {
    renderAt(
      '/dashboard/clientes',
      <NavItem icon={House} to="/dashboard/clientes">
        Clientes
      </NavItem>,
    );

    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');
  });

  it('no se marca como actual en otra página', () => {
    renderAt(
      '/otra',
      <NavItem icon={House} to="/dashboard/clientes">
        Clientes
      </NavItem>,
    );

    expect(screen.getByRole('link', { name: 'Clientes' })).not.toHaveAttribute('aria-current');
  });

  it('avisa al navegar (para que el menú móvil se cierre)', async () => {
    const onNavigate = vi.fn();
    renderAt(
      '/',
      <NavItem icon={House} to="/dashboard/clientes" onNavigate={onNavigate}>
        Clientes
      </NavItem>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Clientes' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('el icono es decorativo', () => {
    const { container } = render(
      <MemoryRouter>
        <NavItem icon={House} to="/x">
          Inicio
        </NavItem>
      </MemoryRouter>,
    );

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('NavItem sin destino', () => {
  it('es un botón anunciado como no disponible', () => {
    renderAt('/', <NavItem icon={House}>Inicio</NavItem>);

    expect(screen.getByRole('button', { name: 'Inicio' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('no es un enlace', () => {
    renderAt('/', <NavItem icon={House}>Inicio</NavItem>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('pulsarlo no avisa de ninguna navegación', async () => {
    const onNavigate = vi.fn();
    renderAt(
      '/',
      <NavItem icon={House} onNavigate={onNavigate}>
        Inicio
      </NavItem>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Inicio' }));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});
