import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientsBadge } from './clients-badge';

describe('ClientsBadge', () => {
  it('muestra la cantidad con separador de miles', () => {
    render(<ClientsBadge count={3827} />);

    expect(screen.getByText('3.827 clientes')).toBeInTheDocument();
  });

  it('usa el singular con un solo cliente', () => {
    render(<ClientsBadge count={1} />);

    expect(screen.getByText('1 cliente')).toBeInTheDocument();
  });

  it('el icono es decorativo', () => {
    const { container } = render(<ClientsBadge count={10} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
