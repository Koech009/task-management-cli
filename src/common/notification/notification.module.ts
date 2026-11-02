// notification.module.ts
import { DynamicModule, Module } from '@nestjs/common';

import { NotificationsService } from './notification.service.js';
import { EmailModule } from '../../common/email/email.module.js';

import type { NotificationOptions } from './notification-options.interface.js';
import { NOTIFICATION_OPTIONS } from './notification.constants.js';

@Module({})
export class NotificationsModule {
  static forRoot(options: NotificationOptions): DynamicModule {
    return {
      module: NotificationsModule,
      imports: [EmailModule.register(options.email)],
      providers: [
        {
          provide: NOTIFICATION_OPTIONS,
          useValue: options,
        },
        NotificationsService,
      ],
      exports: [NotificationsService],
    };
  }
}
