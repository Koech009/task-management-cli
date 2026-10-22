
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard tells Passport to authenticate requests
// using the strategy registered with the name "jwt".
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
