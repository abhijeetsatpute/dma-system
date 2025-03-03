import { S3 } from 'aws-sdk';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_S3_SIGNED_URL_EXPIRATION,
} from '../config';

@Injectable()
export class S3Service {
  private s3: S3;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.s3 = new S3({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION,
      sslEnabled: true,
    });
  }

  async parallelUpload(
    files: { buffer: Buffer; key: string; type: string }[],
  ): Promise<any[]> {
    const uploadPromises: Promise<any>[] = [];

    for (const file of files) {
      const uploadParams = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: file.key,
        Body: file.buffer,
        ContentType: file.type,
        ACL: 'public-read',
      };

      const uploadPromise = this.s3.upload(uploadParams).promise();
      uploadPromises.push(uploadPromise);
    }

    try {
      const results = await Promise.all(uploadPromises);
      this.logger.log('All files uploaded successfully:', results);
      return results;
    } catch (error) {
      this.logger.error(S3Service.name, {
        message: `Error in parallelUpload:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadFile(
    buffer: Buffer | any,
    key: string,
    type?: string,
  ): Promise<any> {
    if (!type) {
      if (key.endsWith('.pdf')) {
        type = 'application/pdf';
      } else if (key.endsWith('.docx')) {
        type =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else {
        type = 'application/octet-stream';
      }
    }

    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: type,
      ACL: 'private',
    };

    try {
      const result = await this.s3.upload(params).promise();
      this.logger.log('File uploaded successfully:', result.Location);
      return result;
    } catch (error) {
      this.logger.error(S3Service.name, {
        message: `Error in uploadFile:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async streamFile(key: string) {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        Expires: parseInt(AWS_S3_SIGNED_URL_EXPIRATION),
      });

      this.logger.log('Streaming file with presigned URL For:', key);
      return url;
    } catch (error) {
      this.logger.error(S3Service.name, {
        message: `Error in streamFile:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteFile(key: string): Promise<any> {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    };
    try {
      const result = await this.s3.deleteObject(params).promise();
      this.logger.log('File deleted successfully:', result);
      return result;
    } catch (error) {
      this.logger.error(S3Service.name, {
        message: `Error in deleteFile:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteFolder(key: string): Promise<any> {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Prefix: key,
    };

    try {
      const data = await this.s3.listObjectsV2(params).promise();
      // If there are objects, delete them
      if (data.Contents && data.Contents.length > 0) {
        const objectsToDelete = data.Contents.map((content) => ({
          Key: content.Key,
        }));
        const deleteParams = {
          Bucket: AWS_S3_BUCKET_NAME,
          Delete: { Objects: objectsToDelete, Quiet: false },
        };
        await this.s3.deleteObjects(deleteParams).promise();
      }
      // Delete the folder itself
      const result = await this.s3
        .deleteObject({
          Bucket: AWS_S3_BUCKET_NAME,
          Key: key,
        })
        .promise();
      this.logger.log('Folder deleted successfully:', result);
    } catch (error) {
      this.logger.error(S3Service.name, {
        message: `Error in deleteFolder:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
