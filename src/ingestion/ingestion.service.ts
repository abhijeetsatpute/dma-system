import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { IngestionUpdatesDto } from './dto/ingestion-updates.dto';
import { PYTHON_API, WEBHOOK } from '../config';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly documentService: DocumentsService,
  ) {}

  async triggerInjestion(user: any, document_id: number) {
    try {
      // health check
      const healthCheckResponse = await this.httpService.axiosRef
        .get(`${PYTHON_API}/health`)
        .then((response) => response)
        .catch((error) => {
          this.logger.error(`Health check failed: ${error.message}`);
          throw new HttpException(
            'Python service is unhealthy',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        });

      if (healthCheckResponse.status === 200) {
        // if healthcheck success
        const result = await this.documentService.findOne(document_id, user);

        // ingest document to python service
        this.httpService.axiosRef.post(`${PYTHON_API}/process-document`, {
          document_id,
          document_name: result.name,
          document_url: result.url,
          callback_url: WEBHOOK,
        });

        this.logger.log(
          `Document ingestion triggered successfully for document ID: ${document_id}`,
        );
        return { message: 'Document ingestion triggered successfully' };
      } else {
        throw new HttpException(
          'Python service is unhealthy',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    } catch (error) {
      this.logger.error(`Error in triggerInjestion: ${error.message}`);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateStatus(payload: IngestionUpdatesDto) {
    const { status, document_id } = payload;
    try {
      await this.documentService.updateDocumentStatus(document_id, status);
    } catch (error) {
      this.logger.error(IngestionService.name, {
        message: `Error in updateStatus`,
        error: error.message,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
