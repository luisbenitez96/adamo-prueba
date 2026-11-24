import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '../schemas';
import { NotificationItem } from './notification-item';

const unread: AppNotification = {
  id: 'n1',
  type: 'password-changed',
  title: 'Cambiaste tu contraseña',
  message: 'Tu contraseña se actualizó.',
  read: false,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
};

describe('NotificationItem', () => {
  it('muestra título, mensaje y hora relativa', () => {
    render(<NotificationItem notification={unread} onRead={() => undefined} />);

    expect(screen.getByText('Cambiaste tu contraseña')).toBeInTheDocument();
    expect(screen.getByText('Tu contraseña se actualizó.')).toBeInTheDocument();
    expect(screen.getByText('hace 5 minutos')).toHaveAttribute('datetime', unread.createdAt);
  });

  it('una no leída es un botón que avisa con su id al pulsarla', async () => {
    const onRead = vi.fn();
    render(<NotificationItem notification={unread} onRead={onRead} />);

    await userEvent.click(screen.getByRole('button', { name: /Cambiaste tu contraseña/ }));

    expect(onRead).toHaveBeenCalledExactlyOnceWith('n1');
  });

  it('una no leída tiene su marca visible', () => {
    render(<NotificationItem notification={unread} onRead={() => undefined} />);

    expect(screen.getByTestId('unread-marker').className).toContain('bg-red-500');
  });

  it('una leída no es un botón, no hace nada y no tiene marca de color', async () => {
    const onRead = vi.fn();
    render(<NotificationItem notification={{ ...unread, read: true }} onRead={onRead} />);

    await userEvent.click(screen.getByText('Cambiaste tu contraseña'));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onRead).not.toHaveBeenCalled();
    expect(screen.getByTestId('unread-marker').className).not.toContain('bg-red-500');
  });

  it('la marca es decorativa', () => {
    render(<NotificationItem notification={unread} onRead={() => undefined} />);

    expect(screen.getByTestId('unread-marker')).toHaveAttribute('aria-hidden', 'true');
  });
});
