import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to TaskFlow',
      html: `
            <h1>Welcome, ${name}!,</h1>
            <p>Your Taskflow account has been created.</p> `,
    });
  }
}
