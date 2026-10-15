import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { FileStorageService } from '../../../infra/storage/file-storage.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let usersService: UsersService;

  const userRepository = {
    findById: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  };
  const fileStorageService = {
    save: vi.fn(),
    delete: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
  };

  const user = {
    id: 'b24d5b69-db9b-480a-b561-46261c0308f8',
    name: 'Test User',
    email: 'voce@example.com',
    passwordHash: 'hashed',
    headline: null,
    bio: null,
    location: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: userRepository },
        { provide: FileStorageService, useValue: fileStorageService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('getPublicProfile', () => {
    it('returns the owner profile', async () => {
      userRepository.findFirst.mockResolvedValue({ ...user, phone: '+55 21 99999-9999' });

      const result = await usersService.getPublicProfile();

      expect(result).toMatchObject({ email: 'voce@example.com' });
      expect(result).not.toHaveProperty('phone');
    });

    it('throws 404 when no profile exists', async () => {
      userRepository.findFirst.mockResolvedValue(null);

      await expect(usersService.getPublicProfile()).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates and returns the profile without passwordHash', async () => {
      const updated = { ...user, headline: 'Backend Developer' };
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updated);

      const profile = await usersService.updateProfile(user.id, {
        headline: 'Backend Developer',
      });

      expect(userRepository.update).toHaveBeenCalledWith(user.id, {
        headline: 'Backend Developer',
      });
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile).toMatchObject({ headline: 'Backend Developer' });
    });

    it('persists and returns a phone number or null when it is removed', async () => {
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue({ ...user, phone: '+55 21 99999-9999' });

      const withPhone = await usersService.updateProfile(user.id, {
        phone: '+55 21 99999-9999',
      });

      expect(userRepository.update).toHaveBeenLastCalledWith(user.id, {
        phone: '+55 21 99999-9999',
      });
      expect(withPhone.phone).toBe('+55 21 99999-9999');

      userRepository.update.mockResolvedValue({ ...user, phone: null });
      const withoutPhone = await usersService.updateProfile(user.id, {
        phone: null,
      });

      expect(userRepository.update).toHaveBeenLastCalledWith(user.id, {
        phone: null,
      });
      expect(withoutPhone.phone).toBeNull();
    });

    it('throws 404 when the user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        usersService.updateProfile('missing-id', { headline: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile with avatarUrl change', () => {
    it('deletes the old file when the avatar changes', async () => {
      userRepository.findById.mockResolvedValue({
        ...user,
        avatarUrl: 'avatars/old.png',
      });
      userRepository.update.mockResolvedValue({
        ...user,
        avatarUrl: 'avatars/new.png',
      });

      await usersService.updateProfile(user.id, {
        avatarUrl: 'avatars/new.png',
      });

      expect(fileStorageService.delete).toHaveBeenCalledWith('avatars/old.png');
    });

    it('keeps the file when the avatar is unchanged', async () => {
      userRepository.findById.mockResolvedValue({
        ...user,
        avatarUrl: 'avatars/same.png',
      });
      userRepository.update.mockResolvedValue({
        ...user,
        avatarUrl: 'avatars/same.png',
      });

      await usersService.updateProfile(user.id, {
        avatarUrl: 'avatars/same.png',
      });

      expect(fileStorageService.delete).not.toHaveBeenCalled();
    });

    it('deletes nothing without previous avatar', async () => {
      userRepository.findById.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(user);

      await usersService.updateProfile(user.id, { headline: 'X' });

      expect(fileStorageService.delete).not.toHaveBeenCalled();
    });
  });
});
