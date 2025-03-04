import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { DocumentStatus } from '../../core/constants';

export class IngestionUpdatesDto {
  @ApiProperty({
    default: 'failed',
    description: 'Ingestion Status',
  })
  @IsNotEmpty()
  @IsString()
  readonly status: DocumentStatus;

  @ApiProperty({
    default: 1,
    type: Number,
    description: 'Document Id',
  })
  @IsNotEmpty()
  @IsNumber()
  readonly document_id: number;
}
