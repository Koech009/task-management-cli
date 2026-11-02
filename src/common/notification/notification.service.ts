// notifications.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type { NotificationOptions } from './notification-options.interface.js';
import { NOTIFICATION_OPTIONS } from './notification.constants.js';
import { EmailService } from '../../common/email/email.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    // Application-level config (app name, default sender) used to
    // template notification content. Provided by NotificationsModule.
    @Inject(NOTIFICATION_OPTIONS)
    private readonly options: NotificationOptions,

    // Handles the actual sending; this service only composes content.
    private readonly emailService: EmailService,
  ) {}

  /**
   * WELCOME EMAIL
   * Builds a welcome subject/message from NotificationOptions and
   * delegates the send to EmailService.
   */
  sendWelcomeEmail(email: string) {
    const subject = `Welcome to ${this.options.applicationName}!`;

    const message =
      `Welcome to ${this.options.applicationName}. ` +
      `This message was sent from ${this.options.defaultSender}.`;

    return this.emailService.sendEmail(email, subject, message);
  }
}
