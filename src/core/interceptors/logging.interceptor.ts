import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const start = Date.now();

    // Proceed to the next handler
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const elapsed = Date.now() - start;

        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${userAgent} |${ip}| - ${elapsed}ms`,
        );
      }),
    );
  }
}
