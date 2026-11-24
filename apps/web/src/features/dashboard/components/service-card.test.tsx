import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ServiceCard } from './service-card';

const service = {
  id: 'pay',
  name: 'Adamo Pay',
  description: 'Gestión de pagos',
  clientsCount: 3827,
  accentColor: '#0e9384',
};

describe('ServiceCard', () => {
  it('es un artículo con el nombre del servicio como título y como nombre accesible', () => {
    render(<ServiceCard service={service} />);

    const card = screen.getByRole('article', { name: 'Adamo Pay' });
    expect(within(card).getByRole('heading', { level: 2, name: 'Adamo Pay' })).toBeInTheDocument();
  });

  it('muestra la descripción y la cantidad de clientes del diseño', () => {
    render(<ServiceCard service={service} />);

    expect(screen.getByText('Gestión de pagos')).toBeInTheDocument();
    expect(screen.getByText('3.827 clientes')).toBeInTheDocument();
  });

  it('el botón muestra "Gestionar clientes" y su nombre accesible dice de qué servicio es', () => {
    render(<ServiceCard service={service} />);

    const button = screen.getByRole('button', { name: 'Gestionar clientes de Adamo Pay' });
    expect(button).toHaveTextContent('Gestionar clientes');
  });

  it('el botón se anuncia como no disponible, sin hacer nada al pulsarlo', async () => {
    render(<ServiceCard service={service} />);
    const button = screen.getByRole('button', { name: /Gestionar clientes/ });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('pinta la barra inferior con el color del servicio', () => {
    render(<ServiceCard service={service} />);

    expect(screen.getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#0e9384' });
  });

  it('la barra de color es decorativa', () => {
    render(<ServiceCard service={service} />);

    expect(screen.getByTestId('accent-bar')).toHaveAttribute('aria-hidden', 'true');
  });

  it('cada servicio usa su propio color', () => {
    render(<ServiceCard service={{ ...service, accentColor: '#7839ee' }} />);

    expect(screen.getByTestId('accent-bar')).toHaveStyle({ backgroundColor: '#7839ee' });
  });
});
