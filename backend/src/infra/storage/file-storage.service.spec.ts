import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { FileStorageService } from './file-storage.service.js';

describe('FileStorageService', () => {
  let storageService: FileStorageService;
  let workingDirectory: string;
  const originalCwd = () => process.cwd();

  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    workingDirectory = await mkdtemp(join(tmpdir(), 'storage-spec-'));
    process.cwd = () => workingDirectory;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageService,
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    storageService = module.get<FileStorageService>(FileStorageService);
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    await rm(workingDirectory, { recursive: true, force: true });
  });

  it('saves the buffer and returns its relative path', async () => {
    const relativePath = await storageService.save(
      Buffer.from('png-bytes'),
      'avatars',
      'image/png',
    );

    expect(relativePath).toMatch(/^avatars\/.+\.png$/);
    const stored = await readFile(join(workingDirectory, 'uploads', relativePath));
    expect(stored.toString()).toBe('png-bytes');
  });

  it('creates nested folders on demand', async () => {
    const relativePath = await storageService.save(
      Buffer.from('x'),
      'products/gallery',
      'image/jpeg',
    );

    expect(relativePath).toMatch(/^products\/gallery\/.+\.jpg$/);
  });

  it('deletes an existing file', async () => {
    const relativePath = await storageService.save(
      Buffer.from('x'),
      'avatars',
      'image/png',
    );

    await storageService.delete(relativePath);

    await expect(
      readFile(join(workingDirectory, 'uploads', relativePath)),
    ).rejects.toThrow();
  });

  it('resolves full urls to relative paths on delete', async () => {
    const relativePath = await storageService.save(
      Buffer.from('x'),
      'avatars',
      'image/png',
    );

    await storageService.delete(
      `http://localhost:8000/uploads/${relativePath}`,
    );

    const remaining = await readdir(
      join(workingDirectory, 'uploads', 'avatars'),
    );
    expect(remaining).not.toContain(relativePath.split('/')[1]);
  });

  it('does not throw when the file is already gone', async () => {
    await expect(
      storageService.delete('avatars/missing.png'),
    ).resolves.toBeUndefined();
  });
});
