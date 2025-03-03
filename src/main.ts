import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseTransformInterceptor } from './core/interceptors/response.interceptor';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply the logging interceptor & Response transformer globally
  app.useGlobalInterceptors(
    new ResponseTransformInterceptor(),
    new LoggingInterceptor(),
  );

  // Swagger UI
  const config = new DocumentBuilder()
    .setTitle('Document Management QnA')
    .setDescription('Document Management QnA API Documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api-docs', app, document);

  await app.listen(PORT ?? 3000);
}
bootstrap();
