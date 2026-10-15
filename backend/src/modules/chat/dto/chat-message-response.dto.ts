import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChatMessage } from '../../../generated/prisma/client.js';

export class ChatMessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  question: string;

  @ApiPropertyOptional({ nullable: true })
  answer?: string | null;

  @ApiProperty({ enum: ['pending', 'done', 'failed'] })
  status: 'pending' | 'done' | 'failed';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(message: ChatMessage): ChatMessageResponseDto {
    return {
      id: message.id,
      question: message.question,
      answer: message.answer,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
