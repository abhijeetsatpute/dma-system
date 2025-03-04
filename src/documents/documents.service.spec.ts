import { Test, TestingModule } from '@nestjs/testing';
import { Document } from './entities/document.entity';
import { S3Service } from '../s3/s3.service';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Role } from '../core/constants';
import { getModelToken } from '@nestjs/sequelize';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let module: TestingModule;
  let documentRepository;
  let s3Service;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken(Document),
          useValue: {
            create: jest.fn(),
            findAndCountAll: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            sequelize: {
              transaction: jest.fn().mockResolvedValue({
                commit: jest.fn(),
                rollback: jest.fn(),
              }),
            },
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
            streamFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentRepository = module.get(getModelToken(Document));
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload a document successfully', async () => {
      const createDocumentDto = new CreateDocumentDto();
      createDocumentDto.name = 'Test Document';
      const document = {
        originalname: 'test.pdf',
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
      } as any;
      const userId = 1;

      const s3Result = {
        Key: 'test-key',
      };

      jest.spyOn(s3Service, 'uploadFile').mockResolvedValueOnce(s3Result);
      jest.spyOn(documentRepository, 'create').mockResolvedValueOnce({
        id: 1,
        name: 'Test Document',
        path: 'test-key',
        uploadedBy: userId,
      });

      const result = await service.upload(createDocumentDto, document, userId);
      expect(result).toEqual({
        id: 1,
        name: 'Test Document',
        path: 'test-key',
        uploadedBy: userId,
      });
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(1);
      expect(documentRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if upload fails', async () => {
      const createDocumentDto = new CreateDocumentDto();
      createDocumentDto.name = 'Test Document';
      const document = {
        originalname: 'test.pdf',
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
      } as any;
      const userId = 1;

      jest
        .spyOn(s3Service, 'uploadFile')
        .mockRejectedValueOnce(new Error('Upload failed'));

      await expect(
        service.upload(createDocumentDto, document, userId),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should fetch all documents for admin', async () => {
      const user = {
        id: 1,
        roles: [Role.ADMIN],
      };
      const limit = 10;
      const offset = 0;

      const documents = [
        {
          id: 1,
          name: 'Document 1',
          path: 'path1',
          uploadedBy: 1,
        },
        {
          id: 2,
          name: 'Document 2',
          path: 'path2',
          uploadedBy: 2,
        },
      ];

      jest.spyOn(documentRepository, 'findAndCountAll').mockResolvedValueOnce({
        count: 2,
        rows: documents,
      });

      const result = await service.findAll(user, limit, offset);
      expect(result).toEqual({
        totalRecords: 2,
        entries: documents,
      });
      expect(documentRepository.findAndCountAll).toHaveBeenCalledTimes(1);
    });

    it('should fetch documents for a specific user', async () => {
      const user = {
        id: 1,
        roles: ['USER'],
      };
      const limit = 10;
      const offset = 0;

      const documents = [
        {
          id: 1,
          name: 'Document 1',
          path: 'path1',
          uploadedBy: 1,
        },
      ];

      jest.spyOn(documentRepository, 'findAndCountAll').mockResolvedValueOnce({
        count: 1,
        rows: documents,
      });

      const result = await service.findAll(user, limit, offset);
      expect(result).toEqual({
        totalRecords: 1,
        entries: documents,
      });
      expect(documentRepository.findAndCountAll).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if fetching fails', async () => {
      const user = {
        id: 1,
        roles: ['USER'],
      };
      const limit = 10;
      const offset = 0;

      jest
        .spyOn(documentRepository, 'findAndCountAll')
        .mockRejectedValueOnce(new Error('Fetch failed'));

      await expect(service.findAll(user, limit, offset)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should fetch a document by id for admin', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: [Role.ADMIN],
      };

      const document = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      const url = 'https://example.com/document';
      const name = 'Document 1';

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(document);
      jest.spyOn(s3Service, 'streamFile').mockResolvedValueOnce(url);

      const result = await service.findOne(id, user);
      expect(result).toStrictEqual({ url, name });
      expect(documentRepository.findByPk).toHaveBeenCalledTimes(1);
      expect(s3Service.streamFile).toHaveBeenCalledTimes(1);
    });

    it('should fetch a document by id for owner', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      const document = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      const url = 'https://example.com/document';
      const name = 'Document 1';

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(document);
      jest.spyOn(s3Service, 'streamFile').mockResolvedValueOnce(url);

      const result = await service.findOne(id, user);
      expect(result).toStrictEqual({ url, name });
      expect(documentRepository.findByPk).toHaveBeenCalledTimes(1);
      expect(s3Service.streamFile).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if document not found', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      jest.spyOn(documentRepository, 'findByPk').mockResolvedValueOnce(null);

      await expect(service.findOne(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
        }),
      );
    });

    it('should throw an error if user is not authorized', async () => {
      const id = 1;
      const user = {
        id: 2,
        roles: ['USER'],
      };

      const document = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(document);

      await expect(service.findOne(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
        }),
      );
    });

    it('should throw an error if fetching fails', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockRejectedValueOnce(new Error('Fetch failed'));

      await expect(service.findOne(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a document successfully', async () => {
      const id = 1;
      const updateDocumentDto = new UpdateDocumentDto();
      updateDocumentDto.name = 'Updated Document';
      const document = {
        originalname: 'updated.pdf',
        buffer: Buffer.from('updated'),
        mimetype: 'application/pdf',
      } as any;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      const s3Result = {
        Key: 'updated-key',
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValueOnce(1);
      jest.spyOn(s3Service, 'uploadFile').mockResolvedValueOnce(s3Result);
      jest.spyOn(documentRepository, 'update').mockResolvedValueOnce([1]);

      await service.update(id, updateDocumentDto, document, user);
      expect(documentRepository.findByPk).toHaveBeenCalledTimes(1);
      expect(s3Service.deleteFile).toHaveBeenCalledTimes(1);
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(1);
      expect(documentRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if document not found', async () => {
      const id = 1;
      const updateDocumentDto = new UpdateDocumentDto();
      updateDocumentDto.name = 'Updated Document';
      const document = {
        originalname: 'updated.pdf',
        buffer: Buffer.from('updated'),
        mimetype: 'application/pdf',
      } as any;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      jest.spyOn(documentRepository, 'findByPk').mockResolvedValueOnce(null);

      await expect(
        service.update(id, updateDocumentDto, document, user),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 404,
        }),
      );
    });

    it('should throw an error if user is not authorized', async () => {
      const id = 1;
      const updateDocumentDto = new UpdateDocumentDto();
      updateDocumentDto.name = 'Updated Document';
      const document = {
        originalname: 'updated.pdf',
        buffer: Buffer.from('updated'),
        mimetype: 'application/pdf',
      } as any;
      const user = {
        id: 2,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);

      await expect(
        service.update(id, updateDocumentDto, document, user),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
        }),
      );
    });

    it('should throw an error if updating fails', async () => {
      const id = 1;
      const updateDocumentDto = new UpdateDocumentDto();
      updateDocumentDto.name = 'Updated Document';
      const document = {
        originalname: 'updated.pdf',
        buffer: Buffer.from('updated'),
        mimetype: 'application/pdf',
      } as any;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);
      jest
        .spyOn(s3Service, 'uploadFile')
        .mockRejectedValueOnce(new Error('Upload failed'));

      await expect(
        service.update(id, updateDocumentDto, document, user),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 400,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a document successfully for admin', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: [Role.ADMIN],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValueOnce(1);
      jest.spyOn(documentRepository, 'destroy').mockResolvedValueOnce(1);

      const result = await service.remove(id, user);
      expect(result).toEqual({
        message: 'Document deleted successfully.',
      });
      expect(documentRepository.findByPk).toHaveBeenCalledTimes(1);
      expect(s3Service.deleteFile).toHaveBeenCalledTimes(1);
      expect(documentRepository.destroy).toHaveBeenCalledTimes(1);
    });

    it('should delete a document successfully for owner', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);
      jest.spyOn(s3Service, 'deleteFile').mockResolvedValueOnce(1);
      jest.spyOn(documentRepository, 'destroy').mockResolvedValueOnce(1);

      const result = await service.remove(id, user);
      expect(result).toEqual({
        message: 'Document deleted successfully.',
      });
      expect(documentRepository.findByPk).toHaveBeenCalledTimes(1);
      expect(s3Service.deleteFile).toHaveBeenCalledTimes(1);
      expect(documentRepository.destroy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if document not found', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      jest.spyOn(documentRepository, 'findByPk').mockResolvedValueOnce(null);

      await expect(service.remove(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
        }),
      );
    });

    it('should throw an error if user is not authorized', async () => {
      const id = 1;
      const user = {
        id: 2,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);

      await expect(service.remove(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
        }),
      );
    });

    it('should throw an error if deletion fails', async () => {
      const id = 1;
      const user = {
        id: 1,
        roles: ['USER'],
      };

      const documentEntry = {
        id: 1,
        name: 'Document 1',
        path: 'path1',
        uploadedBy: 1,
      };

      jest
        .spyOn(documentRepository, 'findByPk')
        .mockResolvedValueOnce(documentEntry);
      jest
        .spyOn(s3Service, 'deleteFile')
        .mockRejectedValueOnce(new Error('Deletion failed'));

      await expect(service.remove(id, user)).rejects.toThrow(
        expect.objectContaining({
          status: 400,
        }),
      );
    });
  });
});
