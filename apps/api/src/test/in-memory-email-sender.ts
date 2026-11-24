import type { EmailMessage, EmailSender } from '../shared/email/email-sender.js';

export class InMemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  messagesTo(address: string): EmailMessage[] {
    return this.sent.filter((message) => message.to === address);
  }
}

export function extractTemporaryPassword(message: EmailMessage): string {
  const match = /Contraseña temporal: (\S+)/.exec(message.text);
  if (!match?.[1]) {
    throw new Error('El correo no contiene una contraseña temporal');
  }
  return match[1];
}
