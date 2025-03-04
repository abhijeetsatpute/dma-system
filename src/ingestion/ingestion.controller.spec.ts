import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { DocumentsService } from '../documents/documents.service';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { DocumentStatus } from '../core/constants';
import { IngestionUpdatesDto } from './dto/ingestion-updates.dto';

describe('IngestionController', () => {
  let ingestionController: IngestionController;
  let ingestionService: IngestionService;
  let documentsService: DocumentsService;

  const mockIngestionService = {
    updateStatus: jest.fn(),
    triggerInjestion: jest.fn(),
  };

  const mockDocumentsService = {
    getDocumentStatus: jest.fn(),
    getAllOngoingIngestions: jest.fn(),
  };

  const mockRequest = {
    user: { id: 1, role: 'admin' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestionService, useValue: mockIngestionService },
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true),
      })
      .compile();

    ingestionController = module.get<IngestionController>(IngestionController);
    ingestionService = module.get<IngestionService>(IngestionService);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(ingestionController).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should update document status successfully', async () => {
      const ingestionUpdatesDto: IngestionUpdatesDto = {
        document_id: 1,
        status: DocumentStatus.PROCESSING,
      };
      mockIngestionService.updateStatus.mockResolvedValue(true);

      const response =
        await ingestionController.updateStatus(ingestionUpdatesDto);
      expect(response).toEqual({
        result: true,
        message: 'Document status updated successfully.',
      });
      expect(mockIngestionService.updateStatus).toHaveBeenCalledWith(
        ingestionUpdatesDto,
      );
    });
  });

  describe('triggerInjestion', () => {
    it('should trigger document ingestion successfully', async () => {
      const docId = 1;
      mockIngestionService.triggerInjestion.mockResolvedValue(true);

      const response = await ingestionController.triggerInjestion(
        mockRequest,
        docId,
      );
      expect(response).toEqual({
        result: true,
        message: 'Document ingestion triggered successfully.',
      });
      expect(mockIngestionService.triggerInjestion).toHaveBeenCalledWith(
        mockRequest.user,
        docId,
      );
    });
  });

  describe('getDocumentStatus', () => {
    it('should get document status successfully', async () => {
      const docId = 1;
      mockDocumentsService.getDocumentStatus.mockResolvedValue({
        status: DocumentStatus.COMPLETED,
      });

      const response = await ingestionController.getDocumentStatus(
        mockRequest,
        docId,
      );
      expect(response).toEqual({
        result: { status: DocumentStatus.COMPLETED },
        message: 'Document ingestion Status Fetched successfully.',
      });
      expect(mockDocumentsService.getDocumentStatus).toHaveBeenCalledWith(
        mockRequest.user,
        docId,
      );
    });
  });

  describe('getAllOngoingIngestions', () => {
    it('should get all ongoing ingestions successfully', async () => {
      const status = DocumentStatus.PROCESSING;
      const limit = 10;
      const offset = 0;
      mockDocumentsService.getAllOngoingIngestions.mockResolvedValue([
        { documentId: 1, status },
      ]);

      const response = await ingestionController.getAllOngoingIngestions(
        mockRequest,
        status,
        limit,
        offset,
      );
      expect(response).toEqual({
        result: [{ documentId: 1, status }],
        message: 'Ongoing ingestions Fetched successfully.',
      });
      expect(mockDocumentsService.getAllOngoingIngestions).toHaveBeenCalledWith(
        mockRequest.user,
        status,
        limit,
        offset,
      );
    });
  });
});
