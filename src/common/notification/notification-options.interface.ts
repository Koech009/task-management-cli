// notification-options.interface.ts
import type { EmailModuleOptions } from '../../common/email/email-options-interface.js';

export interface NotificationOptions {
  applicationName: string;
  defaultSender: string;
  email: EmailModuleOptions;
}
