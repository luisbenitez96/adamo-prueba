import { describe, expect, it } from 'vitest';
import {
  createEmailLogoAttachment,
  EMAIL_LOGO_CID,
  EMAIL_LOGO_HEIGHT,
  EMAIL_LOGO_WIDTH,
} from './email-logo.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('logo para correos', () => {
  const attachment = createEmailLogoAttachment();

  it('es una imagen PNG válida (los clientes de correo no muestran SVG)', () => {
    expect(attachment.contentType).toBe('image/png');
    expect(attachment.filename).toBe('adamo-logo.png');
    expect(attachment.content.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  });

  it('termina con el cierre de un PNG completo, no truncado', () => {
    const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

    expect(attachment.content.subarray(-8).equals(iend)).toBe(true);
  });

  it('tiene el tamaño de la imagen a doble resolución (240 x 214)', () => {
    expect(attachment.content.readUInt32BE(16)).toBe(240);
    expect(attachment.content.readUInt32BE(20)).toBe(214);
  });

  it('pesa poco, para no cargar cada correo', () => {
    expect(attachment.content.length).toBeLessThan(20_000);
  });

  it('se identifica con el cid que usan las plantillas', () => {
    expect(attachment.cid).toBe(EMAIL_LOGO_CID);
    expect(EMAIL_LOGO_CID).toBe('adamo-logo');
  });

  it('el tamaño con el que se muestra conserva la proporción del logo', () => {
    expect(EMAIL_LOGO_WIDTH / EMAIL_LOGO_HEIGHT).toBeCloseTo(240 / 214, 1);
  });

  it('cada llamada entrega una copia nueva, que nadie puede alterar por accidente', () => {
    const first = createEmailLogoAttachment();
    first.content[0] = 0;

    expect(createEmailLogoAttachment().content[0]).toBe(0x89);
  });
});
