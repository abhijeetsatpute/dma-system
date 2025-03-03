import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthGuard } from '../core/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  HttpException,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';

@ApiTags('Documents Management')
@Controller({
  path: 'documents',
  version: '1',
})
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload Document',
    description: 'Upload Document',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('document'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg|webp|tiff)',
          }),
          new MaxFileSizeValidator({ maxSize: 20000000 }),
        ],
        fileIsRequired: false,
        exceptionFactory: (error) => {
          let exceptionMessage = '';
          if (error.includes('size')) {
            // differentiates between type or size exception
            exceptionMessage = 'File size should be less than 20MB';
          } else {
            exceptionMessage =
              'Accepted file types are: png, jpeg, jpg, webp and tiff';
          }
          return new HttpException(
            exceptionMessage,
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
        },
        errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      }),
    )
    document: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.upload(
      createDocumentDto,
      document,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all documents',
    description: 'Get all documents a/c to user role.',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findAll(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.documentsService.findAll(req.user, limit, offset);
    return { result, message: 'Documents Fetched successfully.' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Document by ID',
    description: 'Get Document by ID',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findOne(@Param('id') id: string) {
    const result = await this.documentsService.findOne(+id);
    return { result, message: 'Document Fetched successfully.' };
  }
}
