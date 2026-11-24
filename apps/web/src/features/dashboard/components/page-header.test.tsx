import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('muestra el título como encabezado principal', () => {
    render(<PageHeader title="Clientes" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
  });

  it('incluye el botón de notificaciones, anunciado como no disponible', () => {
    render(<PageHeader title="Clientes" />);

    expect(screen.getByRole('button', { name: 'Notificaciones' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('el punto rojo es decorativo', () => {
    const { container } = render(<PageHeader title="Clientes" />);

    expect(container.querySelector('button span')).toHaveAttribute('aria-hidden', 'true');
  });
});
