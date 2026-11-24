import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  it('muestra el título de la sección', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
  });
});
