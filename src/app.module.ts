import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { S3Module } from './s3/s3.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    // Make ENV vars avaialble globally
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    S3Module,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
