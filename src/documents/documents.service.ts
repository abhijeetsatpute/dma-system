import {
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
      const s3FileName = `${AWS_S3_PATH}/user_${userId}/${document.filename}.docx`;

      // Upload Document to S3 under entry-specific directory
      const s3Result = await this.s3Service.uploadFile(
        document,
        s3FileName,
        document.mimetype,
      );

      // Save S3 key to the table
      const documentEntry = await this.documentRepository.create({
        name: createDocumentDto.name ?? document.filename,
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

  async findOne(id: number): Promise<string> {
    try {
      const document = await this.documentRepository.findByPk(id);

      if (!document) {
        throw new NotFoundException('Docuement Not Found');
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
}
