import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,//lets you run several dab changes in one transaction
  IsNull,//finds sessions whose revokedAt value is NULL
  Repository,//responsible for db operations
} from 'typeorm';
import {
  createHash,
  randomBytes,
  randomUUID,
} from 'node:crypto';

import * as bcrypt from 'bcrypt';

// User entity: represents a user stored in the users table.
import { User } from '../users/entities/user.entity.js';

// UsersService handles user-related operations such as registration and finding a user by email.
import { UsersService } from '../users/users.service.js';
// RefreshSessionEntity represents a refresh-token sessios stored in the refresh_sessions table.
import { RefreshSessionEntity } from '../users/entities/refresh-session.entity.js';
// DTOs define and validate the data accepted by our endpoints.
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    // Allows AuthService to create users and retrieve user records.
    private readonly usersService: UsersService,

    // Signs JWT access tokens and verifies JWTs when needed.
    private readonly jwtService: JwtService,
    //allow multiple db operations to succedd or fail together
    private readonly dataSource : DataSource,
    
    // Injects the repository used to read and write refresh sessions.-provies db acess to refresh sessions
    // The entity must also be registered in AuthModule using
    // TypeOrmModule.forFeature([RefreshSessionEntity]).
    @InjectRepository(RefreshSessionEntity)
    private readonly refreshSessionsRepository:
      Repository<RefreshSessionEntity>,
    
  ) {}

  /**
   * Registers a new user.
   *
   * The UsersService handles password hashing and database creation.
   * We normalize the email before passing it to that service.
   */
  async register(dto: RegisterDto) {
    return this.usersService.create({
      name: dto.name,

      // Convert the email to lowercase and remove surrounding spaces.
      email: dto.email.trim().toLowerCase(),

      // Pass the plain password to UsersService.
      // UsersService should hash it before storing it in the database.
      password: dto.password,
    });
  }

  // CREATE REFRESH SESSION

  /**
   * Generates a refresh token and stores its hash in the database.
   *
   * The original token is returned to the client.
   * Only the hash is stored in refresh_sessions.
   *
   * This method is private because it is an internal operation
   * used by AuthService, not an endpoint exposed to clients.
   */
  private async createRefreshSession(
    user: User,
    familyId: string = randomUUID(),

  ): Promise<string> {
    // 1. Generate a secure, unpredictable refresh token.
    //
    // randomBytes(32) produces 32 cryptographically secure random
    // bytes (256 bits of randomness).
    //
    // Base64url converts those bytes into a URL-safe string.
    // Unlike our access token, this refresh token is not a JWT.
    const refreshToken = randomBytes(32).toString('base64url');

    // 2. Hash the original refresh token using SHA-256.
    //
    // We store this hash instead of the original secret.
    // SHA-256 produces a 64-character hexadecimal string.
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // 3. Set the refresh session's expiry to seven days from now.
    //
    // Date.now() returns the current time in milliseconds.
    // Seven days = 7 * 24 * 60 * 60 * 1000 milliseconds.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    // 4. Create a refresh-session entity.
    //
    // repository.create() prepares an entity object; it does not
    // save anything to MySQL yet.
    //
    // The "user" relationship associates this session with the
    // user who successfully logged in.
    const session = this.refreshSessionsRepository.create({
      user,// manyto one reltation to user
      userId: user.id,//explicitly sets the foreign key value
      tokenHash,//stores the hash not the raw token
      familyId,//group related rotated session
      expiresAt,//expiration timestap
      revokedAt: null,//session is initally not revoked
      replacedBySessionId: null,
    });

    // 5. Save the refresh session to the database.
    //
    // TypeORM inserts a row into refresh_sessions.
    // The database stores tokenHash, not refreshToken.
    await this.refreshSessionsRepository.save(session);

    // 6. Return the original token to the caller.
    //
    // The client needs this token for future refresh requests.
    // Never return tokenHash as a replacement for the original token.
    return refreshToken;
  }

  // LOGIN

  /**
   * Authenticates a user and issues two tokens:
   *
   * 1. Access token: a short-lived JWT used for protected routes.
   * 2. Refresh token: a random secret used to obtain new tokens later.
   */
  async login(dto: LoginDto) {
    // 1. Normalize the submitted email.
    const email = dto.email.trim().toLowerCase();

    // 2. Find the user and retrieve the password hash.
    //
    // This method must explicitly load passwordHash if the User
    // entity defines that column with select: false.
    const user =
      await this.usersService.findByEmailForAuth(email);

    // 3. Check that the user exists and the password is correct.
    //
    // bcrypt.compare() compares the submitted password with
    // the stored hash without needing to decrypt the hash.
    //
    // Use a generic error so we don't reveal whether an email exists.
    if (
      !user ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    // 4. Generate the access JWT.
    //
    // "sub" means subject. We use the user's UUID to identify
    // the account associated with this token.
    //
    // The JWT secret, issuer, audience, and default expiration
    // are configured in AuthModule.
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    // 5. Generate a refresh token and persist its hash.
    //
    // If saving the session fails, login will fail rather than
    // return a refresh token that has no corresponding database row.
    const refreshToken = await this.createRefreshSession(user);

    // 6. Remove passwordHash before returning user information.
    //
    // This destructuring operation excludes passwordHash from
    // the object we send to the client.
    const {
      passwordHash: _passwordHash,
      ...safeUser
    } = user;

    // 7. Return the authentication response.
    //
    // The client receives both tokens, but the database contains
    // only the hash of the refresh token.
    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }


  /**
   * Logs out the client by revoking its refresh-token session.
   *
   * We accept the original refresh token, hash it, and search for
   * the matching database record. The original token is never stored.
   */
  async logout(refreshToken: string) {
    // Reject an empty or missing token.
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Hash the supplied token using the same algorithm used at login.
    // This lets us find the session without storing the raw token.
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Find the session that belongs to this refresh token.
    const session = await this.refreshSessionsRepository.findOne({
      where: { tokenHash },
    });

    // If the session does not exist, do not reveal session details.
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the session only if it has not already been revoked.
    // Setting revokedAt records when logout happened.
    if (session.revokedAt === null) {
      session.revokedAt = new Date();

      // Save the revocation to MySQL.
      await this.refreshSessionsRepository.save(session);
    }

    // Returning success for an already-revoked session makes logout
    // idempotent: repeating the request does not revoke it twice.
    return {
      message: 'Logout successful',
    };
  }


  /**
   * Exchanges a valid refresh token for a new pair of tokens.
   *
   * Rotation means the old refresh token is revoked whenever a
   * replacement is issued. The client must use the replacement
   * refresh token for its next refresh request.
   */
  async refresh(refreshToken: string) {
    // Reject missing or whitespace-only input.
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Hash the supplied token exactly as we did during login.
    // The raw refresh token is never searched for or stored in MySQL.
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Use a transaction so the old session cannot be revoked
    // without its replacement being saved successfully.
    const result = await this.dataSource.transaction(
      async (manager) => {
        const sessions = manager.getRepository(RefreshSessionEntity);

        // Lock this session while processing it. This helps prevent
        // concurrent requests from rotating the same token at once.
        const session = await sessions.findOne({
          where: { tokenHash },
          relations: { user: true },
          lock: { mode: 'pessimistic_write' },
        });

        // A token hash that has no matching database record is invalid.
        if (!session) {
          return { status: 'invalid' as const };
        }

        // If a token was already replaced, its reuse may indicate
        // that an old token has been used again. Revoke the remaining
        // active sessions in this token family as a precaution.
        if (session.revokedAt !== null) {
          if (session.replacedBySessionId !== null) {
            await sessions.update(
              {
                familyId: session.familyId,
                revokedAt: IsNull(),
              },
              {
                revokedAt: new Date(),
              },
            );

            return { status: 'reuse' as const };
          }

          return { status: 'invalid' as const };
        }

        // Do not accept a refresh session that has expired.
        if (session.expiresAt.getTime() <= Date.now()) {
          session.revokedAt = new Date();
          await sessions.save(session);

          return { status: 'expired' as const };
        }

        // Create a fresh, unpredictable refresh token.
        const newRefreshToken = randomBytes(32).toString('base64url');

        // Save only its SHA-256 hash in the database.
        const newTokenHash = createHash('sha256')
          .update(newRefreshToken)
          .digest('hex');

        // The replacement expires seven days from now.
        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        );

        // Keep the same familyId so this session remains linked
        // to the original login and its previous rotations.
        const replacement = sessions.create({
          user: session.user,
          userId: session.userId,
          tokenHash: newTokenHash,
          familyId: session.familyId,
          expiresAt,
          revokedAt: null,
          replacedBySessionId: null,
        });

        // Save the replacement first so we know its session ID.
        const savedReplacement = await sessions.save(replacement);

        // Revoke the old session and record which session replaced it.
        session.revokedAt = new Date();
        session.replacedBySessionId = savedReplacement.id;
        await sessions.save(session);

        // Issue a new short-lived access JWT for the same user.
        const accessToken = await this.jwtService.signAsync({
          sub: session.userId,
        });

        return {
          status: 'success' as const,
          accessToken,
          refreshToken: newRefreshToken,
        };
      },
    );

    // Throw errors only after the transaction has finished.
    // This is important: family revocations must commit rather
    // than being rolled back by an exception inside the transaction.
    if (result.status === 'reuse') {
      throw new UnauthorizedException(
        'Refresh token reuse detected. Please log in again.',
      );
    }

    if (result.status === 'expired') {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (result.status !== 'success') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Return both newly issued tokens to the client.
    return {
      message: 'Tokens refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }


}
