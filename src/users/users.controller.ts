
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';

@Controller('users')
export class UsersController {
  // NestJS injects UsersService into this controller.
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // POST /users
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // GET /users?search=Ian&page=1&limit=10
  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  // GET /users/:id
  // Validate that the supplied ID is a UUID.
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.findOne(id);
  }

  // PATCH /users/:id
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usersService.remove(id);
  }
}
