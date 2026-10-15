import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import {
  ChatQueueUnavailableError,
  ChatService,
} from '../services/chat.service.js';
import { VisitorId } from '../decorators/visitor-id.decorator.js';
import { ChatMessageResponseDto } from '../dto/chat-message-response.dto.js';
import { ChatQueuedResponseDto } from '../dto/chat-queued-response.dto.js';
import { SendChatMessageDto } from '../dto/send-chat-message.dto.js';

const QUEUE_UNAVAILABLE_MESSAGE =
  'Não foi possível enfileirar sua pergunta. Tente de novo em instantes.';

type SendChatMessageResponse =
  | ChatQueuedResponseDto
  | { answer: string }
  | { code: 'QUEUE_UNAVAILABLE'; message: string };

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'POST /chat/messages' })
  @ApiResponse({ status: 201, type: ChatQueuedResponseDto })
  @ApiResponse({
    status: 200,
    description:
      'Pergunta fora do assunto — responde como a IA, sem enfileirar',
    schema: {
      type: 'object',
      properties: { answer: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Body fora do formato' })
  @ApiResponse({
    status: 503,
    description: 'Fila indisponível',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'QUEUE_UNAVAILABLE' },
        message: { type: 'string' },
      },
    },
  })
  async send(
    @VisitorId() visitorId: string,
    @Body() dto: SendChatMessageDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SendChatMessageResponse> {
    try {
      const result = await this.chatService.ask(visitorId, dto.message);
      if (result.kind === 'invalid') {
        // 200 proposital (TD-01): corpo bem formado, rejeição é regra de produto.
        res.status(HttpStatus.OK);
        return { answer: result.answer };
      }
      res.status(HttpStatus.CREATED);
      return {
        id: result.messageId,
        status: 'pending',
        createdAt: result.createdAt,
      };
    } catch (error) {
      if (error instanceof ChatQueueUnavailableError) {
        // Status setado direto (sem throw) para preservar o campo `code`,
        // que o GlobalExceptionFilter removeria.
        res.status(HttpStatus.SERVICE_UNAVAILABLE);
        return { code: 'QUEUE_UNAVAILABLE', message: QUEUE_UNAVAILABLE_MESSAGE };
      }
      throw error;
    }
  }

  @Get('messages')
  @ApiOperation({ summary: 'GET /chat/messages' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Paginação fora do formato' })
  async list(
    @VisitorId() visitorId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatMessageResponseDto>> {
    return this.chatService.listMessages(visitorId, pagination);
  }
}
