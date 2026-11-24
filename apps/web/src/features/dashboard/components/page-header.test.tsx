import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../../test/render-with-providers';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('muestra el título como encabezado principal', () => {
    renderWithProviders(<PageHeader title="Clientes" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
  });

  it('incluye la campana de notificaciones, ya funcional', async () => {
    renderWithProviders(<PageHeader title="Clientes" />);

    const bell = await screen.findByRole('button', { name: /^Notificaciones/ });
    expect(bell).not.toHaveAttribute('aria-disabled');
    expect(bell).toHaveAttribute('aria-expanded', 'false');
  });
});
