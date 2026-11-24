export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
