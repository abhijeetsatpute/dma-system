import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode:
          data.statusCode || context.switchToHttp().getResponse().statusCode,
        message: data.message,
        data: data.result,
      })),
    );
  }
}
