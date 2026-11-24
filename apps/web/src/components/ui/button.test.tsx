import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('muestra su texto como nombre accesible', () => {
    render(<Button>Iniciar sesión</Button>);

    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('ejecuta onClick al hacer clic', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Gestionar clientes</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('por defecto es type="button" y no envía el formulario que lo contiene', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Cancelar</Button>
      </form>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('con type="submit" envía el formulario', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Enviar</Button>
      </form>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado no ejecuta onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('mientras carga', () => {
    it('queda deshabilitado e indica que está ocupado', () => {
      render(<Button loading>Enviando</Button>);

      const button = screen.getByRole('button', { name: 'Enviando' });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('evita el doble envío: los clics no ejecutan onClick', async () => {
      const onClick = vi.fn();
      render(
        <Button loading onClick={onClick}>
          Enviando
        </Button>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('muestra un indicador visual que no se lee como contenido', () => {
      const { container } = render(<Button loading>Enviando</Button>);

      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('fuera de la carga no marca aria-busy ni muestra indicador', () => {
    const { container } = render(<Button>Enviar</Button>);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('respeta una clase adicional sin perder el comportamiento', () => {
    render(<Button className="mt-4">Enviar</Button>);

    expect(screen.getByRole('button')).toHaveClass('mt-4');
  });
});
