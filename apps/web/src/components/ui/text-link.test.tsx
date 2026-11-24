import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ButtonLink } from './button-link';
import { TextLink } from './text-link';

describe('TextLink', () => {
  it('es un enlace con su texto y su destino', () => {
    render(
      <MemoryRouter>
        <TextLink to="/recuperar-contrasena">Haz click aquí</TextLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Haz click aquí' })).toHaveAttribute(
      'href',
      '/recuperar-contrasena',
    );
  });

  it('acepta una clase adicional', () => {
    render(
      <MemoryRouter>
        <TextLink to="/" className="ml-2">
          Inicio
        </TextLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toHaveClass('ml-2');
  });
});

describe('ButtonLink', () => {
  it('es un enlace (no un botón) con su texto y su destino', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/login">Ir a iniciar sesión</ButtonLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('acepta una clase adicional', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/login" className="w-full">
          Entrar
        </ButtonLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toHaveClass('w-full');
  });
});
