
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply validation to all incoming requests.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,//trips properties without validation decorators
      forbidNonWhitelisted: true,//Returns 400 Bad Request if unexpected properties are submitted.
      transform: true,//Enables transformation of incoming request values and DTO instances.
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
