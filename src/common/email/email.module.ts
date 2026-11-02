import { DynamicModule, Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { EmailModuleOptions } from './email-options-interface.js';
import { EMAIL_MODULE_OPTIONS } from './email.constants.js';

@Module({})
export class EmailModule {
  static register(options: EmailModuleOptions): DynamicModule {
    return {
      module: EmailModule,
      providers: [
        {
          provide: EMAIL_MODULE_OPTIONS,
          useValue: options,
        },
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}
