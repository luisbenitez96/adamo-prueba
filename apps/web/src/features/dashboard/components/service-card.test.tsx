import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ServiceCard } from './service-card';

const service = {
  id: 'pay',
  name: 'Adamo Pay',
  description: 'Gestión de pagos',
  clientsCount: 3827,
  accentColor: '#0e9384',
};

function renderCard(overrides: Partial<typeof service> = {}) {
  render(
    <MemoryRouter>
      <ServiceCard service={{ ...service, ...overrides }} />
    </MemoryRouter>,
  );
}

describe('ServiceCard', () => {
  it('es un artículo con el nombre del servicio como título y como nombre accesible', () => {
    renderCard();

    const card = screen.getByRole('article', { name: 'Adamo Pay' });
    expect(within(card).getByRole('heading', { level: 2, name: 'Adamo Pay' })).toBeInTheDocument();
  });

  it('muestra la descripción y la cantidad de clientes del diseño', () => {
    renderCard();

    expect(screen.getByText('Gestión de pagos')).toBeInTheDocument();
    expect(screen.getByText('3.827 clientes')).toBeInTheDocument();
  });

  it('"Gestionar clientes" es un enlace cuyo nombre accesible dice de qué servicio es', () => {
    renderCard();

    const link = screen.getByRole('link', { name: 'Gestionar clientes de Adamo Pay' });
    expect(link).toHaveTextContent('Gestionar clientes');
  });

  it('el enlace lleva a la lista de clientes de ese servicio', () => {
    renderCard({ id: 'abc123', name: 'Adamo ID' });

    expect(screen.getByRole('link', { name: /Gestionar clientes/ })).toHaveAttribute(
      'href',
      '/dashboard/clientes/abc123',
    );
  });

  it('pinta la barra inferior con el color del servicio', () => {
    renderCard();

    expect(screen.getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#0e9384' });
  });

  it('la barra de color es decorativa', () => {
    renderCard();

    expect(screen.getByTestId('accent-bar')).toHaveAttribute('aria-hidden', 'true');
  });

  it('cada servicio usa su propio color', () => {
    renderCard({ accentColor: '#7839ee' });

    expect(screen.getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#7839ee' });
  });
});
