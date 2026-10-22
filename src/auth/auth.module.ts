import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module.js';
import { RefreshSessionEntity } from '../users/entities/refresh-session.entity.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    // Makes configuration values from .env available to this module.
    ConfigModule,

    // Provides UsersService so AuthService can find and create users.
    UsersModule,

    // Registers the repository for RefreshSessionEntity.
    // This enables @InjectRepository(RefreshSessionEntity)
    // inside AuthService to inject the TypeORM repository.
    TypeOrmModule.forFeature([RefreshSessionEntity]),

    // Enables Passport authentication and sets JWT as the default strategy.
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // Configures JWT asynchronously so secrets can be read from .env.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        // Secret used to sign and verify access tokens.
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),

        // Default settings applied when signing access tokens.
        signOptions: {
          expiresIn: '15m',
          issuer: config.getOrThrow<string>('JWT_ISSUER'),
          audience: config.getOrThrow<string>('JWT_AUDIENCE'),
        },
      }),
    }),
  ],

  // Handles incoming authentication HTTP requests.
  controllers: [AuthController],

  // Registers the classes NestJS must instantiate and inject.
  providers: [AuthService, JwtStrategy],

  // Allows other modules to inject AuthService if needed.
  exports: [AuthService],
})
export class AuthModule {}
