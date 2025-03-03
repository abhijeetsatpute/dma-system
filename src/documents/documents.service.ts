import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../core/constants';
import { S3Service } from '../s3/s3.service';
import { AWS_S3_PATH } from '../config';
import { Transaction } from 'sequelize';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(Document)
    private documentRepository: typeof Document,
    private s3Service: S3Service,
  ) {}

  async upload(
    createDocumentDto: CreateDocumentDto,
    document: Express.Multer.File,
    userId: number,
  ): Promise<any> {
    try {
      // Create a custom S3 path using userId
      const s3FileName = `${AWS_S3_PATH}/user_${userId}/${document.originalname}`;

      // Upload Document to S3 under entry-specific directory
      const s3Result = await this.s3Service.uploadFile(
        document.buffer,
        s3FileName,
        document.mimetype,
      );

      // Save S3 key to the table
      const documentEntry = await this.documentRepository.create({
        name: createDocumentDto.name
          ? createDocumentDto.name
          : document.originalname,
        path: s3Result.Key,
        uploadedBy: userId,
      });

      return documentEntry;
    } catch (error) {
      this.logger.error(DocumentsService.name, {
        message: `Error in upload:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(user: any, limit: number, offset: number) {
    try {
      const [userRole] = user.roles;

      if (userRole !== Role.ADMIN) {
        const { count, rows: entries } =
          await this.documentRepository.findAndCountAll({
            where: {
              uploadedBy: user.id,
            },
            limit,
            offset,
            order: [['updatedAt', 'DESC']],
          });
        return { totalRecords: count, entries };
      }

      const { count, rows: entries } =
        await this.documentRepository.findAndCountAll({
          limit,
          offset,
          order: [['updatedAt', 'DESC']],
        });
      return { totalRecords: count, entries };
    } catch (error) {
      this.logger.error(DocumentsService.name, {
        message: `Error in findAll:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOne(id: number, user: any): Promise<string> {
    try {
      const document = await this.documentRepository.findByPk(id);

      if (!document) {
        throw new NotFoundException('Document Not Found');
      }

      const [userRole] = user.roles;
      if (userRole !== Role.ADMIN && document.uploadedBy !== user.id) {
        throw new HttpException(
          'You are not authorized to view this document.',
          HttpStatus.FORBIDDEN,
        );
      }

      const url = await this.s3Service.streamFile(document.path);
      return url;
    } catch (error) {
      this.logger.error(DocumentsService.name, {
        message: `Error in findOne:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(
    id: number,
    updateDocumentDto: UpdateDocumentDto,
    document: Express.Multer.File,
    user: any,
  ) {
    const transaction: Transaction =
      await this.documentRepository.sequelize.transaction();
    try {
      const documentEntry = await this.documentRepository.findByPk(id, {
        transaction,
      });

      if (!documentEntry) {
        throw new NotFoundException('Document Not Found');
      }

      const [userRole] = user.roles;
      if (userRole !== Role.ADMIN && documentEntry.uploadedBy !== user.id) {
        throw new HttpException(
          'You are not authorized to update this document.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (document) {
        // Delete existing file from S3
        await this.s3Service.deleteFile(documentEntry.path);

        // Upload new file
        const s3FileName = `${AWS_S3_PATH}/user_${user.id}/${document.originalname}`;
        const s3Result = await this.s3Service.uploadFile(
          document.buffer,
          s3FileName,
          document.mimetype,
        );

        // Update the document entry
        await this.documentRepository.update(
          {
            name: updateDocumentDto.name ?? document.originalname,
            path: s3Result.Key,
          },
          {
            where: {
              id,
              uploadedBy: user.id,
            },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.logger.error(DocumentsService.name, {
        message: `Error in update:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: number, user: any) {
    const transaction: Transaction =
      await this.documentRepository.sequelize.transaction();
    try {
      const [userRole] = user.roles;
      const documentEntry = await this.documentRepository.findByPk(id, {
        transaction,
      });

      if (!documentEntry) {
        throw new NotFoundException('Document Not Found');
      }

      // for admin dont check uploadedBy
      if (userRole === Role.ADMIN) {
        // Delete existing file from s3
        await this.s3Service.deleteFile(documentEntry.path);

        await this.documentRepository.destroy({
          where: {
            id,
          },
          transaction,
        });
        await transaction.commit();
        return { message: 'Document deleted successfully.' };
      }

      // for non admin check uploadedBy
      if (documentEntry.uploadedBy !== user.id) {
        throw new ForbiddenException(
          'You are not authorized to delete this document.',
        );
      }

      // If the user is authorized, proceed with the deletion
      await this.s3Service.deleteFile(documentEntry.path);

      await this.documentRepository.destroy({
        where: {
          id,
        },
        transaction,
      });
      await transaction.commit();
      return { message: 'Document deleted successfully.' };
    } catch (error) {
      await transaction.rollback();
      this.logger.error(DocumentsService.name, {
        message: `Error in remove:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
