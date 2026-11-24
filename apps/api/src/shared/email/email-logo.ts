import type { EmailAttachment } from './email-sender.js';
import { LOGO_PNG_BASE64 } from './logo-image.js';

export const EMAIL_LOGO_CID = 'adamo-logo';

export const EMAIL_LOGO_WIDTH = 80;
export const EMAIL_LOGO_HEIGHT = 71;

export function createEmailLogoAttachment(): EmailAttachment {
  return {
    filename: 'adamo-logo.png',
    content: Buffer.from(LOGO_PNG_BASE64, 'base64'),
    contentType: 'image/png',
    cid: EMAIL_LOGO_CID,
  };
}
