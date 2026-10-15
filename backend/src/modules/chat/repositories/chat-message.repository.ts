import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import type { ChatMessage } from '../../../generated/prisma/client.js';

@Injectable()
export class ChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(visitorId: string, question: string): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: { visitorId, question, status: 'pending' },
    });
  }

  findById(id: string): Promise<ChatMessage | null> {
    return this.prisma.chatMessage.findUnique({ where: { id } });
  }

  markDone(id: string, answer: string): Promise<ChatMessage> {
    return this.prisma.chatMessage.update({
      where: { id },
      data: { answer, status: 'done' },
    });
  }

  markFailed(id: string): Promise<ChatMessage> {
    return this.prisma.chatMessage.update({
      where: { id },
      data: { status: 'failed' },
    });
  }

  async listByVisitor(
    visitorId: string,
    page: number,
    size: number,
  ): Promise<{ items: ChatMessage[]; total: number }> {
    const where = { visitorId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.chatMessage.count({ where }),
      this.prisma.chatMessage.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { items, total };
  }
}
