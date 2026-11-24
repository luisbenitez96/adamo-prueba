import { describe, expect, it } from 'vitest';
import { notificationSchema, notificationsResponseSchema } from './schemas';

const valid = {
  id: 'n1',
  type: 'password-changed',
  title: 'Cambiaste tu contraseña',
  message: 'Mensaje',
  read: false,
  createdAt: '2030-01-01T12:00:00.000Z',
};

describe('notificationSchema', () => {
  it('acepta una notificación válida', () => {
    expect(notificationSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['sin id', { ...valid, id: '' }],
    ['con tipo desconocido', { ...valid, type: 'otro' }],
    ['sin título', { ...valid, title: '' }],
    ['sin mensaje', { ...valid, message: '' }],
    ['con read que no es booleano', { ...valid, read: 'no' }],
    ['con fecha inválida', { ...valid, createdAt: 'ayer' }],
  ])('rechaza una %s', (_name, value) => {
    expect(notificationSchema.safeParse(value).success).toBe(false);
  });
});

describe('notificationsResponseSchema', () => {
  it('acepta una lista vacía con contador en cero', () => {
    expect(
      notificationsResponseSchema.safeParse({ notifications: [], unreadCount: 0 }).success,
    ).toBe(true);
  });

  it.each([
    ['contador negativo', { notifications: [], unreadCount: -1 }],
    ['contador decimal', { notifications: [], unreadCount: 1.5 }],
    ['sin contador', { notifications: [] }],
    ['lista que no es lista', { notifications: 'x', unreadCount: 0 }],
  ])('rechaza un %s', (_name, value) => {
    expect(notificationsResponseSchema.safeParse(value).success).toBe(false);
  });
});
