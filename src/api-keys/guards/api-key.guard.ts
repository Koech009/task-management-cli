import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

// Import Express Request to tell TypeScript the structure
// of the incoming HTTP request.
import type { Request } from 'express';

// Import the service responsible for validating API keys.
import { ApiKeysService } from '../api-keys.service.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  // NestJS injects an instance of ApiKeysService.
  // The service handles API key validation.
  constructor(private readonly apiKeysService: ApiKeysService) {}

  // Checks whether an incoming request can access a protected route.
  // Because validation is asynchronous, this returns a Promise.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get information about the current HTTP request.
    const request = context.switchToHttp().getRequest<Request>();

    // Read the API key from the x-api-key HTTP header.
    const rawKey = request.headers['x-api-key'];

    // Reject requests that do not provide a non-empty string.
    if (typeof rawKey !== 'string' || rawKey.length === 0) {
      throw new UnauthorizedException('API key is required');
    }

    // Ask the service to check the key against the database.
    const isValid = await this.apiKeysService.validate(rawKey);

    // Reject invalid, revoked, or expired API keys.
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // The key is valid, so allow the request to continue.
    return true;
  }
}
