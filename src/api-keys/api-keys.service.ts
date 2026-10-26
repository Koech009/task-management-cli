import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { createHash, randomBytes } from 'node:crypto';

import { IsNull, Repository } from 'typeorm';

import { ApiKeyEntity } from './entities/api-key.entity.js';

// @Injectable() tells NestJS that this class can participate
// in dependency injection and be used by other providers.
@Injectable()
export class ApiKeysService {
  constructor(
    // @InjectRepository() asks NestJS to inject the TypeORM
    // repository responsible for interacting with ApiKeyEntity.
    //
    // Repository<ApiKeyEntity> provides methods such as:
    // create(), save(), findOne(), and findOneBy().
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  // Converts the original API key into a SHA-256 hash.
  //
  // We store the hash in the database instead of the raw API key.
  // When a client sends its key, we hash it again and compare
  // the result with the stored hash.
  private hashKey(rawKey: string): string {
    return createHash('sha256')
      .update(rawKey) // Supplies the API key as input to the hash.
      .digest('hex'); // Returns the hash as a hexadecimal string.
  }

  // Creates a new API key for an application or integration.
  //
  // name identifies the integration, for example "Reporting Service".
  //
  // expiresAt is optional. If not supplied, it defaults to null,
  // meaning the key has no configured expiration date.
  async create(name: string, expiresAt: Date | null = null) {
    // Generate 32 cryptographically secure random bytes.
    //
    // This creates a difficult-to-guess secret. Base64url encoding
    // converts the bytes into a string suitable for HTTP headers.
    const rawKey = randomBytes(32).toString('base64url');

    // Create an entity object using the generated key's hash.
    //
    // repository.create() constructs an entity instance;
    // it does not save anything to MySQL yet.
    const apiKey = this.apiKeyRepository.create({
      name,

      // Save the hash, not the original secret.
      keyHash: this.hashKey(rawKey),

      // Store the expiration date, or null if there is none.
      expiresAt,

      // null means the key has not been revoked.
      revokedAt: null,
    });

    // Persist the new API key record in the database.
    //
    // TypeORM returns the saved entity, including generated
    // values such as its UUID and creation timestamp.
    const savedKey = await this.apiKeyRepository.save(apiKey);

    // Return the raw secret to the caller only during creation.
    //
    // We deliberately do not return keyHash or the entire entity.
    // The client must save apiKey securely because the raw secret
    // is not stored and cannot be recovered from its hash.
    return {
      id: savedKey.id,
      name: savedKey.name,
      apiKey: rawKey,
      expiresAt: savedKey.expiresAt,
      createdAt: savedKey.createdAt,
    };
  }

  // Checks whether an incoming API key is valid.
  //
  // Promise<boolean> means this asynchronous method eventually
  // returns true if the key is valid, or false otherwise.
  async validate(rawKey: string): Promise<boolean> {
    // Hash the key received from the client.
    // A matching original key produces the same SHA-256 hash.
    const keyHash = this.hashKey(rawKey);

    // Search for a record with this hash that has not been revoked.
    //
    // IsNull() translates to a database condition equivalent to:
    // revokedAt IS NULL.
    //
    // findOne() returns the matching entity or null if none exists.
    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        keyHash,
        revokedAt: IsNull(),
      },
    });

    // If no matching, non-revoked record exists, reject the key.
    if (!apiKey) {
      return false;
    }

    // If an expiration date exists and it is in the past,
    // the key must no longer be accepted.
    //
    // getTime() converts the date to milliseconds since the
    // Unix epoch, allowing comparison with the current time.
    if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    // The record exists, has not been revoked, and has not expired.
    return true;
  }

  // Revokes an API key using its database UUID.
  //
  // Promise<void> means the method does not return a meaningful
  // result when it completes successfully.
  async revoke(id: string): Promise<void> {
    // Find a key by its UUID, provided it has not already been
    // revoked. IsNull() checks that revokedAt is currently NULL.
    const apiKey = await this.apiKeyRepository.findOneBy({
      id,
      revokedAt: IsNull(),
    });

    // If the record does not exist or is already revoked,
    // throw an HTTP 404 Not Found exception.
    if (!apiKey) {
      throw new NotFoundException('API key not found or already revoked');
    }

    // Record the current time as the revocation timestamp.
    // The key is now considered revoked by validate().
    apiKey.revokedAt = new Date();

    // Save the updated entity to MySQL.
    // Future validation attempts will reject this key.
    await this.apiKeyRepository.save(apiKey);
  }
}
