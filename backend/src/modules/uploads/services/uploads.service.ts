import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { FileStorageService } from '../../../infra/storage/file-storage.service.js';

const FOLDER_PATTERN = /^[a-z0-9-_]+$/;

@Injectable()
export class UploadsService {
  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UploadsService.name);
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    folder = 'avatars',
  ): Promise<{ url: string }> {
    if (!FOLDER_PATTERN.test(folder)) {
      throw new BadRequestException('Invalid folder');
    }

    const relativePath = await this.fileStorageService.save(
      buffer,
      folder,
      mimetype,
    );
    const baseUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:8000',
    );
    const url = `${baseUrl}/uploads/${relativePath}`;

    this.logger.info({ folder });
    return { url };
  }
}
