import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKeysController } from './api-keys.controller.js';
import { ApiKeyEntity } from './entities/api-key.entity.js';
import { ApiKeyGuard } from './guards/api-key.guard.js';

@Module({
  imports: [
    // Brings in PassportModule (for JwtAuthGuard) and JwtModule.
    AuthModule,
    TypeOrmModule.forFeature([ApiKeyEntity]),
  ],
  providers: [ApiKeysService, ApiKeyGuard],
  controllers: [ApiKeysController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
