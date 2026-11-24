import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingIndicator } from './loading-indicator';

describe('LoadingIndicator', () => {
  it('se anuncia como estado con el texto "Cargando"', () => {
    render(<LoadingIndicator />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  });

  it('permite cambiar el texto anunciado', () => {
    render(<LoadingIndicator label="Verificando sesión" />);

    expect(screen.getByRole('status')).toHaveTextContent('Verificando sesión');
  });

  it('el spinner es decorativo: solo el texto se anuncia', () => {
    const { container } = render(<LoadingIndicator />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
