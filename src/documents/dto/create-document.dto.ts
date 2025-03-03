import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
  })
  readonly document: Express.Multer.File;

  @ApiProperty({
    default: 'filename',
    required: false,
  })
  @IsOptional()
  readonly name?: string;
}
