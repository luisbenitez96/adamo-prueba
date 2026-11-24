import type { EmailMessage } from '../../shared/email/email-sender.js';

interface TemporaryPasswordEmailData {
  to: string;
  temporaryPassword: string;
  expiresInMinutes: number;
  loginUrl: string;
}

interface EmailContent {
  heading: string;
  intro: string;
  highlight?: string;
  details: string[];
}

const PARAGRAPH_STYLE = 'margin:0 0 16px;color:#4b5563';
const HIGHLIGHT_STYLE =
  'margin:0 0 16px;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-family:monospace;font-size:18px;color:#232a38';

function renderText({ heading, intro, highlight, details }: EmailContent): string {
  return [heading, intro, highlight, ...details].filter(Boolean).join('\n\n');
}

function renderHtml({ heading, intro, highlight, details }: EmailContent): string {
  const paragraph = (content: string) => `<p style="${PARAGRAPH_STYLE}">${content}</p>`;
  const highlightBlock = highlight ? `<p style="${HIGHLIGHT_STYLE}">${highlight}</p>` : '';

  return [
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">',
    `<h1 style="margin:0 0 16px;font-size:20px;color:#232a38">${heading}</h1>`,
    paragraph(intro),
    highlightBlock,
    ...details.map(paragraph),
    '</div>',
  ].join('');
}

function buildMessage(to: string, subject: string, content: EmailContent): EmailMessage {
  return { to, subject, text: renderText(content), html: renderHtml(content) };
}

function temporaryPasswordDetails({
  expiresInMinutes,
  loginUrl,
}: TemporaryPasswordEmailData): string[] {
  return [
    `Vence en ${expiresInMinutes} minutos. Al ingresar, el sistema te pedirá definir una contraseña nueva: ${loginUrl}`,
  ];
}

export function buildWelcomeEmail(data: TemporaryPasswordEmailData): EmailMessage {
  return buildMessage(data.to, 'Tu contraseña temporal de AdamoServices', {
    heading: 'Bienvenido a AdamoServices',
    intro:
      'Recibimos tu solicitud para crear una cuenta. Usa esta contraseña temporal para iniciar sesión:',
    highlight: `Contraseña temporal: ${data.temporaryPassword}`,
    details: [...temporaryPasswordDetails(data), 'Si no fuiste tú, puedes ignorar este mensaje.'],
  });
}

export function buildPasswordResetEmail(data: TemporaryPasswordEmailData): EmailMessage {
  return buildMessage(data.to, 'Restablece tu contraseña de AdamoServices', {
    heading: 'Restablece tu contraseña',
    intro:
      'Recibimos una solicitud para restablecer tu contraseña. Usa esta contraseña temporal para iniciar sesión:',
    highlight: `Contraseña temporal: ${data.temporaryPassword}`,
    details: [
      ...temporaryPasswordDetails(data),
      'Si no fuiste tú, puedes ignorar este mensaje: tu contraseña actual sigue funcionando.',
    ],
  });
}
