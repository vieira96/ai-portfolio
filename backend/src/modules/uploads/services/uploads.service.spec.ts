import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { FileStorageService } from '../../../infra/storage/file-storage.service.js';
import { UploadsService } from './uploads.service.js';

describe('UploadsService', () => {
  let uploadsService: UploadsService;

  const fileStorageService = {
    save: vi.fn(),
    delete: vi.fn(),
  };
  const configService = {
    get: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: FileStorageService, useValue: fileStorageService },
        { provide: ConfigService, useValue: configService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    uploadsService = module.get<UploadsService>(UploadsService);
  });

  it('saves the file in the given folder and returns its full url', async () => {
    fileStorageService.save.mockResolvedValue('avatars/uuid.png');
    configService.get.mockReturnValue('http://localhost:8000');

    await expect(
      uploadsService.upload(Buffer.from('png-bytes'), 'image/png', 'avatars'),
    ).resolves.toEqual({
      url: 'http://localhost:8000/uploads/avatars/uuid.png',
    });
    expect(fileStorageService.save).toHaveBeenCalledWith(
      Buffer.from('png-bytes'),
      'avatars',
      'image/png',
    );
  });

  it('rejects folders outside the safe pattern', async () => {
    await expect(
      uploadsService.upload(Buffer.from('x'), 'image/png', '../../etc'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fileStorageService.save).not.toHaveBeenCalled();
  });
});
