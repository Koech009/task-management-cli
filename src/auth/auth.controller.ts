import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { LogoutDto } from './dto/logout.dto.js';

import { UseGuards, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
// Runtime import: CurrentUser is used as a decorator.
import { CurrentUser } from './decorators/current-user.decorator.js';
// Type-only import: AuthenticatedUser is only used by TypeScript.
import type { AuthenticatedUser } from './decorators/current-user.decorator.js';
import { RolesGuard } from './guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { Roles } from './decorators/roles.decorator.js';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({
    default: { limit: 5, ttl: 60_000 },
  })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    //exchange the submtted refrsh token for a new pair
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /auth/logout
   *
   * Receives the refresh token and asks AuthService to revoke
   * the corresponding database session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * GET /auth/me
   *
   * Returns the currently authenticated user.
   * JwtAuthGuard validates the access token.
   * CurrentUser extracts the user from request.user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
  /**
   * GET /auth/admin-check
   *
   * Both guards must allow the request:
   * 1. JwtAuthGuard validates the access token.
   * 2. RolesGuard checks the user's role.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-check')
  adminCheck() {
    return {
      message: 'Welcome, administrator!',
    };
  }
}
