import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service.js';

// Shape of the data stored inside the access token.
interface AccessTokenPayload {
  sub: string; // The user's ID (the JWT "subject").
  iat?: number; // Issued-at time, added automatically when the token is signed.
  exp?: number; // Expiry time, added automatically from the token lifetime.
}

// Passport strategy that checks the JWT on every protected request.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // Tell passport-jwt where to find the token and how to verify it.
    super({
      // Read the token from the "Authorization: Bearer <token>" header.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens.
      ignoreExpiration: false,

      // Secret used to verify the signature. The app refuses to start
      // if any of these three values is missing from .env.
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),

      // The token must come from this issuer and be meant for this audience.
      // AuthService must use the same values when it signs tokens.
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      audience: config.getOrThrow<string>('JWT_AUDIENCE'),
    });
  }

  // Runs only after the signature, expiry, issuer and audience checks pass.
  // Whatever this returns is attached to the request as req.user.
  async validate(payload: AccessTokenPayload) {
    // A valid token must carry a user ID.
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    try {
      // Load the user so deleted accounts can no longer use old tokens.
      const user = await this.usersService.findOne(payload.sub);

      // Return only the fields controllers and guards need.
      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch {
      // findOne throws NotFoundException for a missing user;
      // return 401 instead so the response doesn't reveal which IDs exist.
      throw new UnauthorizedException();
    }
  }
}