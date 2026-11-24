import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthFormShell } from './auth-form-shell';

describe('AuthFormShell', () => {
  it('muestra el título como encabezado principal, la descripción y el contenido', () => {
    render(
      <AuthFormShell title="Recupera tu contraseña" description="Ingresa tu correo">
        <button type="button">Enviar</button>
      </AuthFormShell>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recupera tu contraseña' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ingresa tu correo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('forma una región con el nombre del título', () => {
    render(
      <AuthFormShell title="Recupera tu contraseña" description="Ingresa tu correo">
        <span />
      </AuthFormShell>,
    );

    expect(screen.getByRole('region', { name: 'Recupera tu contraseña' })).toBeInTheDocument();
  });

  it('no mueve el foco por defecto', () => {
    render(
      <AuthFormShell title="Título" description="Descripción">
        <span />
      </AuthFormShell>,
    );

    expect(screen.getByRole('heading')).not.toHaveFocus();
  });

  it('con focusTitleOnMount lleva el foco al título', () => {
    render(
      <AuthFormShell title="Título" description="Descripción" focusTitleOnMount>
        <span />
      </AuthFormShell>,
    );

    expect(screen.getByRole('heading')).toHaveFocus();
  });
});
