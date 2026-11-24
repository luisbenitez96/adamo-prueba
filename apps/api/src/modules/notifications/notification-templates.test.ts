import { describe, expect, it } from 'vitest';
import { NOTIFICATION_TEMPLATES } from './notification-templates.js';
import { NOTIFICATION_TYPES } from './notification.entity.js';

describe('plantillas de notificación', () => {
  it('hay una plantilla para cada tipo', () => {
    expect(Object.keys(NOTIFICATION_TEMPLATES).sort()).toEqual([...NOTIFICATION_TYPES].sort());
  });

  it.each(NOTIFICATION_TYPES)('%s tiene título y mensaje', (type) => {
    expect(NOTIFICATION_TEMPLATES[type].title.length).toBeGreaterThan(5);
    expect(NOTIFICATION_TEMPLATES[type].message.length).toBeGreaterThan(20);
  });

  it('los títulos son distintos entre sí', () => {
    const titles = NOTIFICATION_TYPES.map((type) => NOTIFICATION_TEMPLATES[type].title);

    expect(new Set(titles).size).toBe(NOTIFICATION_TYPES.length);
  });

  it('las alertas de seguridad le dicen al usuario qué hacer si no fue él', () => {
    expect(NOTIFICATION_TEMPLATES['temporary-password-requested'].message).toContain(
      'Si no fuiste tú',
    );
    expect(NOTIFICATION_TEMPLATES['password-changed'].message).toContain('Si no fuiste tú');
  });
});
