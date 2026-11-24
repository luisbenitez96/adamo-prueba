import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './text-field';

describe('TextField', () => {
  it('asocia la etiqueta con el campo', () => {
    render(<TextField label="Correo electrónico" />);

    expect(screen.getByLabelText('Correo electrónico')).toBeInstanceOf(HTMLInputElement);
  });

  it('usa la etiqueta como placeholder, como en el diseño', () => {
    render(<TextField label="Correo electrónico" />);

    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
  });

  it('permite un placeholder distinto al de la etiqueta', () => {
    render(<TextField label="Correo electrónico" placeholder="ejemplo@email.com" />);

    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'placeholder',
      'ejemplo@email.com',
    );
  });

  it('lo que escribe el usuario llega al campo y a onChange', async () => {
    const onChange = vi.fn();
    render(<TextField label="Correo electrónico" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@correo.com');
    expect(onChange).toHaveBeenCalled();
  });

  it('pasa al input los atributos nativos (type, autoComplete, name, disabled)', () => {
    render(
      <TextField
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        name="email"
        disabled
      />,
    );

    const input = screen.getByLabelText('Correo electrónico');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toBeDisabled();
  });

  it('entrega la referencia al input (necesario para react-hook-form)', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Correo electrónico" ref={ref} />);

    expect(ref.current).toBe(screen.getByLabelText('Correo electrónico'));
  });

  it('respeta un id indicado', () => {
    render(<TextField label="Correo electrónico" id="correo" />);

    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('id', 'correo');
  });

  it('dos campos tienen ids distintos y cada etiqueta apunta a su campo', () => {
    render(
      <>
        <TextField label="Nombre" />
        <TextField label="Apellido" />
      </>,
    );

    const first = screen.getByLabelText('Nombre');
    const second = screen.getByLabelText('Apellido');
    expect(first.id).not.toBe(second.id);
  });

  describe('texto de ayuda', () => {
    it('se lee como descripción del campo', () => {
      render(
        <TextField
          label="Nueva contraseña"
          hint="Al menos 8 caracteres, una mayúscula y un número."
        />,
      );

      expect(screen.getByLabelText('Nueva contraseña')).toHaveAccessibleDescription(
        'Al menos 8 caracteres, una mayúscula y un número.',
      );
    });

    it('sin ayuda ni error el campo no tiene descripción', () => {
      render(<TextField label="Nombre" />);

      expect(screen.getByLabelText('Nombre')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('con error', () => {
    it('lo muestra como alerta y marca el campo como inválido', () => {
      render(<TextField label="Correo electrónico" error="Ingresa un correo electrónico válido" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Ingresa un correo electrónico válido');
      expect(screen.getByLabelText('Correo electrónico')).toBeInvalid();
    });

    it('el error se lee como descripción del campo, antes que la ayuda', () => {
      render(<TextField label="Contraseña" hint="Mínimo 8 caracteres." error="Es muy corta" />);

      expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
        'Es muy corta Mínimo 8 caracteres.',
      );
    });

    it('sin error no hay alerta ni se marca inválido', () => {
      render(<TextField label="Correo electrónico" />);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByLabelText('Correo electrónico')).toBeValid();
    });
  });

  it('muestra el contenido final (por ejemplo, el botón del ojo)', () => {
    render(<TextField label="Contraseña" trailing={<button type="button">Ojo</button>} />);

    expect(screen.getByRole('button', { name: 'Ojo' })).toBeInTheDocument();
  });
});
