import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { LoggerMiddlware } from './common/middleware/logger.middleware.js';
// import { EmailModule } from './common/email/email.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import Joi from 'joi';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_DATABASE: Joi.string().required(),

        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_TTL: Joi.string().default('15m'),
        JWT_ISSUER: Joi.string().required(),
        JWT_AUDIENCE: Joi.string().required(),

        REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().positive().default(7),

        PORT: Joi.number().port().default(3000),
        FRONTEND_URL: Joi.string().uri().required(),
      }),
    }),
    // Configure rate limiting: 10 requests per 60 seconds.
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 10,
        },
      ],
    }),

    // Load environment variables from .env.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configure the MySQL database.
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false,
    }),

    // Register application modules.
    UsersModule,
    AuthModule,
    ProjectsModule,
    ApiKeysModule,
    TasksModule,
  ],

  // Register the rate limiter as a global guard.
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR, //registers an interceptor globbally
      useClass: ClassSerializerInterceptor, //tell nest which interceptor to use
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to requests handled by users routes.
    consumer.apply(LoggerMiddlware).forRoutes('users');
  }
}
