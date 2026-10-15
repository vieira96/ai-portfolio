import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import type { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { ChatMessageResponseDto } from '../dto/chat-message-response.dto.js';
import { EducationsService } from '../../educations/services/educations.service.js';
import { ExperiencesService } from '../../experiences/services/experiences.service.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';
import { UsersService } from '../../users/services/users.service.js';
import { ChatMessageRepository } from '../repositories/chat-message.repository.js';

export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const INVALID_SUBJECT_TEXT =
  'Desculpe, só respondo perguntas sobre experiência, projetos, habilidades e formação.';

export const CHAT_GENERATION_QUEUE = 'chat-generation';

export type AskResult =
  | { kind: 'invalid'; answer: string }
  | { kind: 'queued'; messageId: string; createdAt: Date };

export class ChatQueueUnavailableError extends Error {
  constructor() {
    super('Chat queue unavailable');
    this.name = 'ChatQueueUnavailableError';
  }
}

function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return 'atual';
  }
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    @InjectQueue(CHAT_GENERATION_QUEUE)
    private readonly chatGenerationQueue: Queue,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly experiencesService: ExperiencesService,
    private readonly technologiesService: TechnologiesService,
    private readonly educationsService: EducationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
  }

  async ask(visitorId: string, message: unknown): Promise<AskResult> {
    if (typeof message !== 'string') {
      return { kind: 'invalid', answer: INVALID_SUBJECT_TEXT };
    }
    const question = message.trim();
    if (question === '' || question.length > MAX_CHAT_MESSAGE_LENGTH) {
      return { kind: 'invalid', answer: INVALID_SUBJECT_TEXT };
    }

    const created = await this.chatMessageRepository.createPending(visitorId, question);
    try {
      await this.chatGenerationQueue.add('generate', { messageId: created.id });
    } catch {
      await this.chatMessageRepository.markFailed(created.id);
      this.logger.warn({ reason: 'queue_unavailable', messageId: created.id });
      throw new ChatQueueUnavailableError();
    }
    return { kind: 'queued', messageId: created.id, createdAt: created.createdAt };
  }

  async listMessages(
    visitorId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatMessageResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? 4;
    const { items, total } = await this.chatMessageRepository.listByVisitor(
      visitorId,
      page,
      size,
    );

    return {
      data: items.map((message) => ChatMessageResponseDto.from(message)),
      total,
      page,
      totalPages: Math.ceil(total / size),
    };
  }

  async buildContext(): Promise<string> {
    const [profile, projects, experiences, technologies, educations] =
      await Promise.all([
        this.usersService.getPublicProfile(),
        this.collectAll((page) =>
          this.projectsService.findAll({ page, size: 20 }),
        ),
        this.collectAll((page) =>
          this.experiencesService.findAll({ page, size: 20 }),
        ),
        this.technologiesService.findAll(),
        this.collectAll((page) =>
          this.educationsService.findAll({ page, size: 20 }),
        ),
      ]);

    const lines: string[] = [];
    lines.push(
      `Perfil: ${profile.name}${profile.headline ? ` — ${profile.headline}` : ''}`,
    );
    if (profile.bio) {
      lines.push(`Bio: ${profile.bio}`);
    }
    if (profile.location) {
      lines.push(`Localização: ${profile.location}`);
    }

    if (projects.length > 0) {
      lines.push('Projetos:');
      for (const project of projects) {
        const techs = project.technologies.map((tech) => tech.name).join(', ');
        lines.push(
          `- ${project.name}: ${project.description}${techs ? ` [${techs}]` : ''}`,
        );
      }
    }

    if (experiences.length > 0) {
      lines.push('Experiências:');
      for (const experience of experiences) {
        const techs = experience.technologies
          .map((tech) => tech.name)
          .join(', ');
        lines.push(
          `- ${experience.position} em ${experience.company} ` +
            `(${formatDate(experience.startedAt)}–${formatDate(experience.endedAt)}): ` +
            `${experience.description}${techs ? ` [${techs}]` : ''}`,
        );
      }
    }

    if (technologies.length > 0) {
      lines.push(
        `Habilidades: ${technologies
          .map((tech) => `${tech.name} (${tech.category})`)
          .join(', ')}`,
      );
    }

    if (educations.length > 0) {
      lines.push('Formação:');
      for (const education of educations) {
        lines.push(
          `- ${education.course} em ${education.institution}` +
            `${education.degree ? ` (${education.degree})` : ''}`,
        );
      }
    }

    return lines.join('\n');
  }

  private async collectAll<T>(
    fetchPage: (page: number) => Promise<PaginatedResponseDto<T>>,
  ): Promise<T[]> {
    const first = await fetchPage(1);
    const items = [...first.data];
    for (let page = 2; page <= first.totalPages; page += 1) {
      const next = await fetchPage(page);
      items.push(...next.data);
    }
    return items;
  }
}
