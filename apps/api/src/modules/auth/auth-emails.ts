import {
  createEmailLogoAttachment,
  EMAIL_LOGO_CID,
  EMAIL_LOGO_HEIGHT,
  EMAIL_LOGO_WIDTH,
} from '../../shared/email/email-logo.js';
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

const PAGE_BACKGROUND = '#f3f4f6';
const BRAND_COLOR = '#111927';
const PARAGRAPH_STYLE = 'margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.5';
const HIGHLIGHT_STYLE =
  'margin:0 0 16px;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-family:monospace;font-size:18px;color:#232a38';

function renderText({ heading, intro, highlight, details }: EmailContent): string {
  return [heading, intro, highlight, ...details].filter(Boolean).join('\n\n');
}

function renderLogo(): string {
  return `<img src="cid:${EMAIL_LOGO_CID}" alt="AdamoServices" width="${EMAIL_LOGO_WIDTH}" height="${EMAIL_LOGO_HEIGHT}" style="display:block;border:0;margin:0 auto" />`;
}

function renderHtml({ heading, intro, highlight, details }: EmailContent): string {
  const paragraph = (content: string) => `<p style="${PARAGRAPH_STYLE}">${content}</p>`;
  const highlightBlock = highlight ? `<p style="${HIGHLIGHT_STYLE}">${highlight}</p>` : '';

  return [
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BACKGROUND};padding:24px 0;font-family:Arial,sans-serif"><tr><td align="center">`,
    '<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden">',
    `<tr><td align="center" style="background:${BRAND_COLOR};padding:28px 0">${renderLogo()}</td></tr>`,
    '<tr><td style="padding:28px 32px">',
    `<h1 style="margin:0 0 16px;font-size:20px;color:#232a38">${heading}</h1>`,
    paragraph(intro),
    highlightBlock,
    ...details.map(paragraph),
    '</td></tr></table></td></tr></table>',
  ].join('');
}

function buildMessage(to: string, subject: string, content: EmailContent): EmailMessage {
  return {
    to,
    subject,
    text: renderText(content),
    html: renderHtml(content),
    attachments: [createEmailLogoAttachment()],
  };
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
