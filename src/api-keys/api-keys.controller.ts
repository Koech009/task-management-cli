import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { Throttle } from '@nestjs/throttler';

// All routes in this controller begin with /api-keys.
@Controller('api-keys')
// Require a logged-in user and check their role.
@UseGuards(JwtAuthGuard, RolesGuard)
// Only administrators can manage API keys.
@Roles(UserRole.ADMIN)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  // POST /api-keys
  // Creates an API key and returns its raw value once.
  @Post()
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  create(@Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(
      dto.name,
      dto.expiresAt ? new Date(dto.expiresAt) : null,
    );
  }

  // POST /api-keys/:id/revoke
  // Revokes an API key using its UUID.
  @Post(':id/revoke')
  revoke(@Param('id', ParseUUIDPipe) id: string) {
    return this.apiKeysService.revoke(id);
  }
}
