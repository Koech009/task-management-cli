import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppInfoService } from './config/app-info.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appInfoService: AppInfoService,
  ) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }

  @Get()
  getAppName() {
    return this.appInfoService.getAppName();
  }
}
