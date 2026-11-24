import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  it('muestra la inicial del correo en mayúscula', () => {
    render(<UserAvatar email="ana@correo.com" />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it.each([[undefined], [''], ['   ']])(
    'sin correo útil (%j) muestra un signo de interrogación',
    (email) => {
      render(<UserAvatar email={email} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    },
  );

  it('es decorativo: no se anuncia a los lectores de pantalla', () => {
    render(<UserAvatar email="ana@correo.com" />);

    expect(screen.getByText('A')).toHaveAttribute('aria-hidden', 'true');
  });
});
