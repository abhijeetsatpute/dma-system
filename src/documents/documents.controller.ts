import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../core/decoraters/roles.decorater';

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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('document'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '.(pdf|docx|doc|txt)',
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
            exceptionMessage = 'Accepted file types are: pdf|docx|doc|txt';
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
    const result = await this.documentsService.upload(
      createDocumentDto,
      document,
      req.user.id,
    );
    return { result, message: 'Documents uploaded successfully.' };
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
  async findOne(@Param('id') id: number, @Request() req) {
    const result = await this.documentsService.findOne(id, req.user);
    return { result, message: 'Document Fetched successfully.' };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Document by ID',
    description: 'Update Document by ID',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('document'))
  async update(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: '.(pdf|docx|doc|txt)',
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
            exceptionMessage = 'Accepted file types are: pdf|docx|doc|txt';
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
    @Param('id') id: number,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    const result = await this.documentsService.update(
      +id,
      updateDocumentDto,
      document,
      req.user,
    );
    return { result, message: 'Document updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete Document by ID',
    description: 'Delete Document by ID',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  async remove(@Param('id') id: number, @Request() req) {
    const result = await this.documentsService.remove(id, req.user);
    return { result, message: 'Document deleted successfully.' };
  }
}
