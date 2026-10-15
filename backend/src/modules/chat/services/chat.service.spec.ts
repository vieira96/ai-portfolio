import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { EducationsService } from '../../educations/services/educations.service.js';
import { ExperiencesService } from '../../experiences/services/experiences.service.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { ChatMessageRepository } from '../repositories/chat-message.repository.js';
import {
  ChatQueueUnavailableError,
  ChatService,
  INVALID_SUBJECT_TEXT,
} from './chat.service.js';

describe('ChatService', () => {
  const chatMessages = {
    createPending: vi.fn(),
    findById: vi.fn(),
    markDone: vi.fn(),
    markFailed: vi.fn(),
    listByVisitor: vi.fn(),
  };
  const queue = {
    add: vi.fn(),
  };
  const usersService = {
    getPublicProfile: vi.fn(),
  };
  const projectsService = {
    findAll: vi.fn(),
  };
  const experiencesService = {
    findAll: vi.fn(),
  };
  const technologiesService = {
    findAll: vi.fn(),
  };
  const educationsService = {
    findAll: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  async function createService(): Promise<ChatService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ChatMessageRepository, useValue: chatMessages },
        { provide: getQueueToken('chat-generation'), useValue: queue },
        { provide: UsersService, useValue: usersService },
        { provide: ProjectsService, useValue: projectsService },
        { provide: ExperiencesService, useValue: experiencesService },
        { provide: TechnologiesService, useValue: technologiesService },
        { provide: EducationsService, useValue: educationsService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    return module.get<ChatService>(ChatService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ask', () => {
    it('answers as the AI without queueing when message is not a string', async () => {
      const service = await createService();

      const result = await service.ask('visitor-1', undefined);

      expect(result).toEqual({ kind: 'invalid', answer: INVALID_SUBJECT_TEXT });
      expect(chatMessages.createPending).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('answers as the AI without queueing when message is blank', async () => {
      const service = await createService();

      const result = await service.ask('visitor-1', '   ');

      expect(result).toEqual({ kind: 'invalid', answer: INVALID_SUBJECT_TEXT });
      expect(chatMessages.createPending).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('answers as the AI without queueing when message is too long', async () => {
      const service = await createService();

      const result = await service.ask('visitor-1', 'x'.repeat(2001));

      expect(result).toEqual({ kind: 'invalid', answer: INVALID_SUBJECT_TEXT });
      expect(chatMessages.createPending).not.toHaveBeenCalled();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('creates pending and enqueues for a valid question', async () => {
      const createdAt = new Date('2026-10-07T12:00:00.000Z');
      chatMessages.createPending.mockResolvedValue({ id: 'msg-1', createdAt });
      const service = await createService();

      const result = await service.ask('visitor-1', '  onde atuou?  ');

      expect(chatMessages.createPending).toHaveBeenCalledWith(
        'visitor-1',
        'onde atuou?',
      );
      expect(queue.add).toHaveBeenCalledWith('generate', {
        messageId: 'msg-1',
      });
      expect(result).toEqual({ kind: 'queued', messageId: 'msg-1', createdAt });
    });

    it('marks failed and throws when the queue is down', async () => {
      chatMessages.createPending.mockResolvedValue({ id: 'msg-1' });
      queue.add.mockRejectedValue(new Error('ECONNREFUSED'));
      const service = await createService();

      await expect(service.ask('visitor-1', 'onde atuou?')).rejects.toBeInstanceOf(
        ChatQueueUnavailableError,
      );
      expect(chatMessages.markFailed).toHaveBeenCalledWith('msg-1');
    });
  });

  describe('listMessages', () => {
    const pending = {
      id: 'msg-1',
      visitorId: 'visitor-1',
      question: 'onde atuou?',
      answer: null,
      status: 'pending',
      createdAt: new Date('2026-10-07T12:00:00.000Z'),
      updatedAt: new Date('2026-10-07T12:00:00.000Z'),
    };
    const done = {
      id: 'msg-2',
      visitorId: 'visitor-1',
      question: 'e com Redis?',
      answer: 'Atuei sim.',
      status: 'done',
      createdAt: new Date('2026-10-07T12:01:00.000Z'),
      updatedAt: new Date('2026-10-07T12:01:31.000Z'),
    };

    it('lists only the owner messages in order with pagination', async () => {
      chatMessages.listByVisitor.mockResolvedValue({
        items: [pending, done],
        total: 3,
      });
      const service = await createService();

      const result = await service.listMessages('visitor-1', {
        page: 1,
        size: 2,
      });

      expect(chatMessages.listByVisitor).toHaveBeenCalledWith(
        'visitor-1',
        1,
        2,
      );
      expect(result).toMatchObject({
        total: 3,
        page: 1,
        totalPages: 2,
        data: [
          { id: 'msg-1', answer: null, status: 'pending' },
          { id: 'msg-2', answer: 'Atuei sim.', status: 'done' },
        ],
      });
    });

    it('applies falling back defaults for page and size', async () => {
      chatMessages.listByVisitor.mockResolvedValue({ items: [], total: 0 });
      const service = await createService();

      const result = await service.listMessages('visitor-1', {});

      expect(chatMessages.listByVisitor).toHaveBeenCalledWith(
        'visitor-1',
        1,
        4,
      );
      expect(result).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
    });
  });
  describe('buildContext', () => {
    it('assembles profile, projects, experiences, skills and education', async () => {
      usersService.getPublicProfile.mockResolvedValue({
        name: 'Rafael Vieira',
        headline: 'Full-stack',
        bio: 'Bio.',
        location: 'Osasco - SP',
      });
      projectsService.findAll.mockResolvedValue({
        data: [
          {
            name: 'Portfólio',
            description: 'Site pessoal.',
            technologies: [{ name: 'NestJS' }],
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      experiencesService.findAll.mockResolvedValue({
        data: [
          {
            company: 'Levante Lab',
            position: 'Dev Full Stack',
            description: 'Sistemas web.',
            startedAt: new Date('2023-01-15'),
            endedAt: null,
            technologies: [{ name: 'React' }],
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      technologiesService.findAll.mockResolvedValue([
        { name: 'NestJS', category: 'BACKEND' },
      ]);
      educationsService.findAll.mockResolvedValue({
        data: [
          {
            course: 'Sistemas',
            institution: 'USP',
            degree: 'GRADUACAO',
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      const service = await createService();

      const context = await service.buildContext();

      expect(context).toContain('Rafael Vieira');
      expect(context).toContain('Portfólio');
      expect(context).toContain('Levante Lab');
      expect(context).toContain('NestJS (BACKEND)');
      expect(context).toContain('USP');
    });
  });
});
