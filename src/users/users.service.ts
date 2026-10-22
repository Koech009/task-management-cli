import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Create a new user and save them in the database.
  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check whether another user already uses this email.
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Hash the plain-text password before storing it.
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Create the entity without accepting an ID from the client.
    const user = this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      passwordHash,
    });

    // Save the new user; TypeORM generates the UUID.
    const savedUser = await this.usersRepository.save(user);

    // Never return the password hash in the API response.
    const { passwordHash: _passwordHash, ...safeUser } = savedUser;

    return safeUser;
  }

  // Get users with searching, filtering, sorting, and pagination.
  async findAll(query: QueryUsersDto) {
    const {
      search,
      role,
      sortBy = 'createdAt',
      order = 'DESC',
      page = '1',
      limit = '10',
    } = query;

    // Convert query-string values to numbers.
    const pageNumber = Number(page);
    const requestedLimit = Number(limit);

    // Reject invalid pagination values.
    if (
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      throw new BadRequestException('Page and limit must be positive integers');
    }

    // Prevent excessively large database queries.
    const limitNumber = Math.min(requestedLimit, 100);

    // Start building the database query.
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // Search for partial matches in the name or email.
    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter users by role when a role is provided.
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Only allow known database columns for sorting.
    const allowedSortFields = [
      'id',
      'name',
      'email',
      'role',
      'createdAt',
      'updatedAt',
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Apply sorting. UUIDs can also be used as a sort field.
    queryBuilder
      .orderBy(`user.${safeSortBy}`, safeOrder)
      .addOrderBy('user.id', 'ASC');

    // Calculate how many records to skip.
    const skip = (pageNumber - 1) * limitNumber;

    // Apply pagination.
    queryBuilder.skip(skip).take(limitNumber);

    // Retrieve this page and the total matching count.
    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // Find one user by UUID.
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Update an existing user's permitted fields.
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findOne(id);

    // Prevent changing an email to one already in use.
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email is already registered');
      }
    }

    // Update only fields supplied in the request.
    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    // Hash a new password rather than storing plain text.
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    const savedUser = await this.usersRepository.save(user);

    // Remove the password hash from the response.
    const { passwordHash: _passwordHash, ...safeUser } = savedUser;

    return safeUser;
  }

  // Delete a user by UUID.
  async remove(id: string) {
    const user = await this.findOne(id);

    await this.usersRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }

  // Used during login: explicitly retrieves passwordHash
  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }
}
