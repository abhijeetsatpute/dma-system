import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseTransformInterceptor } from './core/interceptors/response.interceptor';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Allow CORS
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // global validation pipe to validate and transform incoming request data
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api-docs', app, document);

  await app.listen(PORT ?? 3000);
}
bootstrap();
