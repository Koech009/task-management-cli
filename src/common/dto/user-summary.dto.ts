import { User } from '../../users/entities/user.entity.js';

// Minimal user info that is safe to expose (no email or password hash).
export class UserSummaryDto {
  id: string;
  name: string;

  static fromEntity(user: User): UserSummaryDto {
    return {
      id: user.id,
      name: user.name,
    };
  }
}
