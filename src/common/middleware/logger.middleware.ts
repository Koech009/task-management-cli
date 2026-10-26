import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddlware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    console.log('Requesting....', new Date().toDateString());

    console.log(`${req.method} ${req.originalUrl}`);

    next();
  }
}
