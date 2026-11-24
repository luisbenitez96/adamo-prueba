import nodemailer from 'nodemailer';
import { describe, expect, it, vi } from 'vitest';
import { NodemailerEmailSender } from './nodemailer-email-sender.js';

const message = {
  to: 'ana@correo.com',
  subject: 'Asunto de prueba',
  text: 'Texto plano',
  html: '<p>Texto html</p>',
};

describe('NodemailerEmailSender', () => {
  it('entrega un mensaje con remitente, destinatario, asunto y contenido', async () => {
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    const sendMail = vi.spyOn(transporter, 'sendMail');
    const sender = new NodemailerEmailSender(transporter, 'AdamoServices <no-reply@adamo.local>');

    await sender.send(message);

    const info = await sendMail.mock.results[0]?.value;
    expect(JSON.parse(info.message)).toMatchObject({
      subject: 'Asunto de prueba',
      text: 'Texto plano',
      html: '<p>Texto html</p>',
      from: { address: 'no-reply@adamo.local', name: 'AdamoServices' },
      to: [{ address: 'ana@correo.com' }],
    });
  });

  it('propaga el error si el transporte falla', async () => {
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    vi.spyOn(transporter, 'sendMail').mockRejectedValue(new Error('SMTP caído'));
    const sender = new NodemailerEmailSender(transporter, 'no-reply@adamo.local');

    await expect(sender.send(message)).rejects.toThrow('SMTP caído');
  });
});
