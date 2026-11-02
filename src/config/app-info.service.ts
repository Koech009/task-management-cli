import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class AppInfoService implements OnModuleInit {
  private readonly logger = new Logger(AppInfoService.name);

  onModuleInit() {
    this.logger.log('AppInfoService has been initialized');
  }

  getAppName() {
    return 'Taskflow API';
  }
}
