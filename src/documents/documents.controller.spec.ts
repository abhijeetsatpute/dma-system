import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Document } from './entities/document.entity';

const mockUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  role: 'admin',
};

const mockDocument = {
  id: 1,
  name: 'Sample Document',
  path: 'sample.pdf',
  status: 'pending',
  uploadedBy: mockUser.id,
  user: mockUser,
};

const mockCreateDocumentDto: CreateDocumentDto = {
  document: {
    buffer: Buffer.from('file content'),
    mimetype: 'application/pdf',
  } as Express.Multer.File,
  name: 'Sample Document',
};

const mockUpdateDocumentDto: UpdateDocumentDto = {
  name: 'Updated Document',
  document: {
    buffer: Buffer.from('file content'),
    mimetype: 'application/pdf',
  } as Express.Multer.File,
};

const mockDocumentsService = {
  upload: jest.fn().mockResolvedValue(mockDocument),
  findAll: jest.fn().mockResolvedValue([mockDocument]),
  findOne: jest.fn().mockResolvedValue(mockDocument),
  update: jest.fn().mockResolvedValue(mockDocument),
  remove: jest.fn().mockResolvedValue({}),
};

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
        JwtService,
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    documentsService = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should successfully upload a document with name', async () => {
      const document = {
        buffer: Buffer.from('file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const result = await controller.upload(document, mockCreateDocumentDto, {
        user: mockUser,
      });
      expect(result).toEqual({
        result: mockDocument,
        message: 'Documents uploaded successfully.',
      });
      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        mockCreateDocumentDto,
        document,
        mockUser.id,
      );
    });

    it('should successfully upload a document with no name', async () => {
      const document = {
        buffer: Buffer.from('file content'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const createDocumentDto: CreateDocumentDto = {
        document,
        name: undefined,
      }; // no name provided
      const result = await controller.upload(document, createDocumentDto, {
        user: mockUser,
      });
      expect(result).toEqual({
        result: mockDocument,
        message: 'Documents uploaded successfully.',
      });
      expect(mockDocumentsService.upload).toHaveBeenCalledWith(
        createDocumentDto,
        document,
        mockUser.id,
      );
    });

    it('should throw an error if file size exceeds the limit', async () => {
      const document = {
        buffer: Buffer.from('a'.repeat(21000000)),
      } as Express.Multer.File; // 21MB file
      try {
        await controller.upload(document, mockCreateDocumentDto, {
          user: mockUser,
        });
      } catch (error) {
        expect(error.response).toBe('File size should be less than 20MB');
        expect(error.status).toBe(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
    });

    it('should throw an error if invalid file type is uploaded', async () => {
      const document = {
        buffer: Buffer.from('file content'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;
      try {
        await controller.upload(document, mockCreateDocumentDto, {
          user: mockUser,
        });
      } catch (error) {
        expect(error.response).toBe(
          'Accepted file types are: pdf|docx|doc|txt',
        );
        expect(error.status).toBe(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const result = await controller.findAll({ user: mockUser });
      expect(result).toEqual({
        result: [mockDocument],
        message: 'Documents Fetched successfully.',
      });
      expect(mockDocumentsService.findAll).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('should return a single document by ID', async () => {
      const result = await controller.findOne(1, { user: mockUser });
      expect(result).toEqual({
        result: mockDocument,
        message: 'Document Fetched successfully.',
      });
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith(1, mockUser);
    });
  });

  describe('update', () => {
    it('should successfully update a document', async () => {
      const document = {
        buffer: Buffer.from('updated file content'),
      } as Express.Multer.File;
      const result = await controller.update(
        document,
        1,
        mockUpdateDocumentDto,
        { user: mockUser },
      );
      expect(result).toEqual({
        result: mockDocument,
        message: 'Document updated successfully.',
      });
      expect(mockDocumentsService.update).toHaveBeenCalledWith(
        1,
        mockUpdateDocumentDto,
        document,
        mockUser,
      );
    });

    it('should throw an error if invalid file type is uploaded for update', async () => {
      const document = {
        buffer: Buffer.from('file content'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;
      try {
        await controller.update(document, 1, mockUpdateDocumentDto, {
          user: mockUser,
        });
      } catch (error) {
        expect(error.response).toBe(
          'Accepted file types are: pdf|docx|doc|txt',
        );
        expect(error.status).toBe(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
    });
  });

  describe('remove', () => {
    it('should successfully delete a document by ID', async () => {
      const result = await controller.remove(1, { user: mockUser });
      expect(result).toEqual({
        result: {},
        message: 'Document deleted successfully.',
      });
      expect(mockDocumentsService.remove).toHaveBeenCalledWith(1, mockUser);
    });
  });
});
