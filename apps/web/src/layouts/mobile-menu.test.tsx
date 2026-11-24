import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MobileMenu } from './mobile-menu';

function Harness({ open, onClose = () => undefined }: { open: boolean; onClose?: () => void }) {
  return (
    <>
      <button type="button">Abrir</button>
      <MobileMenu open={open} onClose={onClose}>
        <a href="/primero">Primero</a>
        <button type="button">Segundo</button>
        <a href="/tercero">Tercero</a>
      </MobileMenu>
    </>
  );
}

describe('MobileMenu', () => {
  it('cerrado no muestra nada', () => {
    render(<Harness open={false} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('abierto es un diálogo modal con nombre y con su contenido', () => {
    render(<Harness open />);

    const dialog = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('link', { name: 'Primero' })).toBeInTheDocument();
  });

  it('al abrir lleva el foco al diálogo', () => {
    render(<Harness open />);

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('el botón Cerrar menú pide cerrar', async () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('la tecla Escape pide cerrar', async () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pulsar fuera del menú (en el fondo oscuro) pide cerrar', async () => {
    const onClose = vi.fn();
    const { container } = render(<Harness open onClose={onClose} />);
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;

    await userEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pulsar dentro del menú no lo cierra', async () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);

    await userEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  describe('foco atrapado', () => {
    it('Tab desde el último elemento vuelve al primero', async () => {
      render(<Harness open />);
      screen.getByRole('link', { name: 'Tercero' }).focus();

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
    });

    it('Shift+Tab desde el primer elemento salta al último', async () => {
      render(<Harness open />);
      screen.getByRole('button', { name: 'Cerrar menú' }).focus();

      await userEvent.tab({ shift: true });

      expect(screen.getByRole('link', { name: 'Tercero' })).toHaveFocus();
    });

    it('Tab entre elementos intermedios avanza con normalidad', async () => {
      render(<Harness open />);
      screen.getByRole('link', { name: 'Primero' }).focus();

      await userEvent.tab();

      expect(screen.getByRole('button', { name: 'Segundo' })).toHaveFocus();
    });
  });

  describe('al abrir y cerrar', () => {
    it('bloquea el desplazamiento de la página mientras está abierto y lo restaura al cerrar', () => {
      const { rerender } = render(<Harness open={false} />);
      expect(document.body.style.overflow).toBe('');

      rerender(<Harness open />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Harness open={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('devuelve el foco al elemento que lo tenía antes de abrir', () => {
      const { rerender } = render(<Harness open={false} />);
      screen.getByRole('button', { name: 'Abrir' }).focus();

      rerender(<Harness open />);
      expect(screen.getByRole('dialog')).toHaveFocus();
      rerender(<Harness open={false} />);

      expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
    });

    it('si cambia la función de cierre no le quita el foco al usuario', () => {
      const { rerender } = render(<Harness open onClose={() => undefined} />);
      screen.getByRole('button', { name: 'Segundo' }).focus();

      rerender(<Harness open onClose={() => undefined} />);

      expect(screen.getByRole('button', { name: 'Segundo' })).toHaveFocus();
    });

    it('al cerrarse deja de escuchar el teclado', async () => {
      const onClose = vi.fn();
      const { rerender } = render(<Harness open onClose={onClose} />);
      rerender(<Harness open={false} onClose={onClose} />);

      await userEvent.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
