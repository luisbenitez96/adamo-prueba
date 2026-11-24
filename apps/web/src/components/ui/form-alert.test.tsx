import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormAlert } from './form-alert';

describe('FormAlert', () => {
  it('se anuncia como alerta con su mensaje', () => {
    render(<FormAlert>Correo o contraseña incorrectos</FormAlert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });

  it('acepta una clase adicional', () => {
    render(<FormAlert className="mt-4">Aviso</FormAlert>);

    expect(screen.getByRole('alert')).toHaveClass('mt-4');
  });
});
