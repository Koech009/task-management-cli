import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_MODULE_OPTIONS } from './email.constants.js';
// import { EmailModuleOptions } from './email-options-interface.js';
import type { EmailModuleOptions } from './email-options-interface.js';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_MODULE_OPTIONS)
    private readonly options: EmailModuleOptions,
  ) {}

  sendEmail(to: string, subject: string, message: string) {
    console.log('Sending email...');
    console.log('From:', this.options.senderEmail);
    console.log('Sender name:', this.options.senderName);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Message:', message);

    return {
      success: true,
      message: 'Email operation completed',
    };
  }
}
