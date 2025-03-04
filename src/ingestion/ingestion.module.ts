import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { DocumentsModule } from '../documents/documents.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DocumentsModule, HttpModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
