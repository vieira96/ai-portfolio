import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PinoLogger } from 'nestjs-pino';

const EXTENSIONS_BY_MIMETYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

@Injectable()
export class FileStorageService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(FileStorageService.name);
  }

  async save(
    buffer: Buffer,
    folder: string,
    mimetype: string,
  ): Promise<string> {
    const extension = EXTENSIONS_BY_MIMETYPE[mimetype] ?? 'bin';
    const filename = `${randomUUID()}.${extension}`;
    const directory = join(process.cwd(), 'uploads', folder);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), buffer);

    this.logger.info({ folder, filename });
    return `${folder}/${filename}`;
  }

  async delete(relativePath: string): Promise<void> {
    const relative = relativePath.includes('/uploads/')
      ? relativePath.split('/uploads/').pop()!
      : relativePath;
    try {
      await unlink(join(process.cwd(), 'uploads', relative));
    } catch {
      this.logger.warn({ relativePath }, 'File to delete not found');
    }
  }
}
