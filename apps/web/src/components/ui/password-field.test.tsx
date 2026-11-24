import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { PasswordField } from './password-field';

describe('PasswordField', () => {
  it('oculta lo escrito por defecto', () => {
    render(<PasswordField label="Contraseña" />);

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('el botón del ojo muestra y vuelve a ocultar la contraseña', async () => {
    render(<PasswordField label="Contraseña" />);
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });

    await userEvent.click(toggle);
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');

    await userEvent.click(toggle);
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('el botón informa su estado con aria-pressed', async () => {
    render(<PasswordField label="Contraseña" />);
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('el botón no envía el formulario', async () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <PasswordField label="Contraseña" />
      </form>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(submitted).toBe(false);
  });

  it('conserva lo escrito al mostrar y ocultar', async () => {
    render(<PasswordField label="Contraseña" />);

    await userEvent.type(screen.getByLabelText('Contraseña'), 'Secreta123');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(screen.getByLabelText('Contraseña')).toHaveValue('Secreta123');
  });

  it('se puede llegar al botón con el teclado', async () => {
    render(<PasswordField label="Contraseña" />);

    await userEvent.tab();
    expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveFocus();
  });

  it('muestra la ayuda y el error como cualquier otro campo', () => {
    render(
      <PasswordField
        label="Nueva contraseña"
        hint="Al menos 8 caracteres, una mayúscula y un número."
        error="La contraseña es muy corta"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('La contraseña es muy corta');
    expect(screen.getByLabelText('Nueva contraseña')).toBeInvalid();
    expect(
      screen.getByText('Al menos 8 caracteres, una mayúscula y un número.'),
    ).toBeInTheDocument();
  });

  it('pasa autoComplete y entrega la referencia al input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordField label="Contraseña" autoComplete="new-password" ref={ref} />);

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(ref.current).toBe(screen.getByLabelText('Contraseña'));
  });

  it('el icono es decorativo: solo el botón tiene nombre', () => {
    const { container } = render(<PasswordField label="Contraseña" />);

    expect(container.querySelector('button svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
