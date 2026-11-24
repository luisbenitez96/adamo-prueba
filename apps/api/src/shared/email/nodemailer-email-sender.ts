import type { Transporter } from 'nodemailer';
import type { EmailMessage, EmailSender } from './email-sender.js';

export class NodemailerEmailSender implements EmailSender {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
  }
}
