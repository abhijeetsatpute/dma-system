import { IngestionService } from './ingestion.service';
import { IngestionUpdatesDto } from './dto/ingestion-updates.dto';
import { DocumentsService } from '../documents/documents.service';
import { ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../core/guards/auth.guard';
import { DocumentStatus } from '../core/constants';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decoraters/roles.decorater';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';

@Controller('ingestion')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly documentService: DocumentsService,
  ) {}

  @Post('/status')
  @ApiOperation({
    summary: 'Webhook to get document status updates',
    description: 'Webhook to get document status updates',
  })
  async updateStatus(@Body() ingestionUpdates: IngestionUpdatesDto) {
    const result = await this.ingestionService.updateStatus(ingestionUpdates);
    return {
      result,
      message: 'Document status updated successfully.',
    };
  }

  @Get('/trigger/:id')
  @ApiOperation({
    summary: 'Trigger Document ingestion document id',
    description: 'Trigger Document ingestion document id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Enter document id',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  async triggerInjestion(@Request() req, @Param('id', ParseIntPipe) docId) {
    const result = await this.ingestionService.triggerInjestion(
      req.user,
      docId,
    );
    return {
      result,
      message: 'Document ingestion triggered successfully.',
    };
  }

  @Get('/document/:id')
  @ApiOperation({
    summary: 'Get Document ingestion Status by document id',
    description: 'Get Document ingestion Status by document id',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Enter document id',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getDocumentStatus(@Request() req, @Param('id', ParseIntPipe) docId) {
    const result = await this.documentService.getDocumentStatus(
      req.user,
      docId,
    );
    return {
      result,
      message: 'Document ingestion Status Fetched successfully.',
    };
  }

  @Get(':status')
  @ApiOperation({
    summary: 'Get all ongoing ingestions',
    description: 'Get all ongoing ingestions',
  })
  @ApiParam({
    name: 'status',
    enum: DocumentStatus,
    description: 'Enter status',
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getAllOngoingIngestions(
    @Request() req,
    @Param('status') status: DocumentStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.documentService.getAllOngoingIngestions(
      req.user,
      status,
      limit,
      offset,
    );
    return { result, message: 'Ongoing ingestions Fetched successfully.' };
  }
}
