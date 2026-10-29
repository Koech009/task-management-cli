import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //read request info
    const request = context.switchToHttp().getRequest();

    const method = request.method;
    const url = request.url;
    const startTime = Date.now(); //record starting time
    console.log(`[REQUEST ] ${method} ${url}`);

    //execute the handler
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        console.log(`[RESPONSE] ${method} ${url} - ${duration}ms`);
      }),
    );
  }
}
/* 
next.handle() invokes the handler.
.pipe() lets us apply RxJS operators to the returned stream.
tap() executes our logging callback when a result is emitted.
duration measures the elapsed time in milliseconds.
Notice that tap() does not change the handler's returned data.
*/
