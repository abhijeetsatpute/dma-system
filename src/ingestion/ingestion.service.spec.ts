import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { IngestionService } from './ingestion.service';
import { DocumentsService } from '../documents/documents.service';
import { IngestionUpdatesDto } from './dto/ingestion-updates.dto';
import { HttpException } from '@nestjs/common';
import { DocumentStatus } from '../core/constants';

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let httpService: HttpService;
  let documentService: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
              post: jest.fn(),
            },
          },
        },
        {
          provide: DocumentsService,
          useValue: {
            findOne: jest.fn(),
            updateDocumentStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    ingestionService = module.get<IngestionService>(IngestionService);
    httpService = module.get<HttpService>(HttpService);
    documentService = module.get<DocumentsService>(DocumentsService);
  });

  describe('triggerInjestion', () => {
    it('should trigger ingestion successfully', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValue({ status: 200 });
      jest.spyOn(documentService, 'findOne').mockResolvedValue({
        name: 'test.pdf',
        url: 'https://example.com/test.pdf',
      });
      jest.spyOn(httpService.axiosRef, 'post').mockResolvedValue({});

      await expect(
        ingestionService.triggerInjestion({ id: 1 }, 1),
      ).resolves.toEqual({
        message: 'Document ingestion triggered successfully',
      });
    });

    it('should throw an error if Python service is unhealthy', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockRejectedValue(new Error('Service Down'));

      await expect(
        ingestionService.triggerInjestion({ id: 1 }, 1),
      ).rejects.toThrow(HttpException);
    });

    it('should throw an error if document is not found', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValue({ status: 200 });
      jest
        .spyOn(documentService, 'findOne')
        .mockRejectedValue(new Error('Document Not Found'));

      await expect(
        ingestionService.triggerInjestion({ id: 1 }, 1),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateStatus', () => {
    it('should update document status successfully', async () => {
      const payload: IngestionUpdatesDto = {
        status: DocumentStatus.PROCESSING,
        document_id: 1,
      };
      jest.spyOn(documentService, 'updateDocumentStatus').mockResolvedValue({});

      await expect(
        ingestionService.updateStatus(payload),
      ).resolves.toBeUndefined();
    });

    it('should throw an error if updateDocumentStatus fails', async () => {
      const payload: IngestionUpdatesDto = {
        status: DocumentStatus.FAILED,
        document_id: 1,
      };
      jest
        .spyOn(documentService, 'updateDocumentStatus')
        .mockRejectedValue(new Error('Database error'));

      await expect(ingestionService.updateStatus(payload)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
