import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClientStatusBadge } from './client-status-badge';

describe('ClientStatusBadge', () => {
  it.each([
    ['active', 'Activo'],
    ['pending', 'Pendiente'],
    ['inactive', 'Inactivo'],
  ] as const)('el estado %s se muestra como "%s"', (status, label) => {
    render(<ClientStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('cada estado tiene un color distinto', () => {
    const { rerender } = render(<ClientStatusBadge status="active" />);
    const classes = new Set<string>();

    (['active', 'pending', 'inactive'] as const).forEach((status) => {
      rerender(<ClientStatusBadge status={status} />);
      classes.add(screen.getByText(/Activo|Pendiente|Inactivo/).className);
    });

    expect(classes.size).toBe(3);
  });
});
