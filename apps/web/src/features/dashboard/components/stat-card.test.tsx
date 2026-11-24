import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('es un artículo con el nombre de la métrica, su valor y su nota', () => {
    render(<StatCard label="Clientes totales" value="16.769" caption="En 4 servicios" />);

    const card = screen.getByRole('article', { name: 'Clientes totales' });
    expect(card).toHaveTextContent('16.769');
    expect(card).toHaveTextContent('En 4 servicios');
  });

  it('sin nota no deja un espacio vacío', () => {
    render(<StatCard label="Activos" value="5" />);

    expect(screen.getByRole('article').querySelectorAll('p')).toHaveLength(2);
  });

  it('sin estado no muestra el punto de color', () => {
    render(<StatCard label="Clientes totales" value="5" />);

    expect(screen.queryByTestId('status-dot')).not.toBeInTheDocument();
  });

  it('el punto de color es decorativo y cada estado tiene un color distinto', () => {
    const classes = new Set<string>();

    (['active', 'pending', 'inactive'] as const).forEach((tone) => {
      const { unmount } = render(<StatCard label="x" value="1" tone={tone} />);
      const dot = screen.getByTestId('status-dot');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
      classes.add(dot.className);
      unmount();
    });

    expect(classes.size).toBe(3);
  });
});
