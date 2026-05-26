import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInvitation(
    email: string,
    storeName: string,
    inviterName: string,
    acceptUrl: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"Jastip Platform" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
      to: email,
      subject: `Undangan bergabung ke toko ${storeName}`,
      html: `
        <div style="font-family: 'DM Sans', Inter, sans-serif; max-width: 520px; margin: 0 auto; background: #F5F3EE; padding: 32px;">
          <div style="background: #FFFFFF; border: 1px solid #E0DDD6; padding: 48px 40px;">
            <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8A8880; margin: 0 0 40px 0;">
              Jastip Platform
            </p>
            <h1 style="font-size: 18px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; color: #1A1A18; margin: 0 0 20px 0;">
              Undangan Bergabung
            </h1>
            <p style="font-size: 14px; color: #5A5852; line-height: 1.7; margin: 0 0 32px 0;">
              <strong style="color: #1A1A18;">${inviterName}</strong> mengundang kamu untuk bergabung ke toko
              <strong style="color: #1A1A18;">${storeName}</strong> di Jastip Platform.
            </p>
            <a href="${acceptUrl}"
               style="display: inline-block; background: #1A1A18; color: #FFFFFF; padding: 14px 36px; text-decoration: none; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500;">
              Terima Undangan
            </a>
            <p style="font-size: 12px; color: #8A8880; margin: 32px 0 0 0; line-height: 1.6; border-top: 1px solid #E0DDD6; padding-top: 24px;">
              Jika kamu tidak merasa diundang, abaikan email ini. Tautan ini hanya bisa digunakan satu kali.
            </p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Invitation email sent to ${email} for store ${storeName}`);
  }
}
