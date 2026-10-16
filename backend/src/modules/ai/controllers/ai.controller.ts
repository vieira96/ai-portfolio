import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { AiWritingAssistanceRequestDto } from '../dto/ai-writing-assistance-request.dto.js';
import { AiHealthResponseDto } from '../dto/ai-health-response.dto.js';
import { AiWritingAssistanceResponseDto } from '../dto/ai-writing-assistance-response.dto.js';
import { AiService } from '../services/ai.service.js';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @ApiOperation({ summary: '/ai/health' })
  @ApiResponse({ status: 200, type: AiHealthResponseDto })
  checkHealth(): Promise<AiHealthResponseDto> {
    return this.aiService.checkHealth();
  }

  @Post('writing-assistance')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/ai/writing-assistance' })
  @ApiBody({ type: AiWritingAssistanceRequestDto })
  @ApiResponse({ status: 201, type: AiWritingAssistanceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid field type or text' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication',
  })
  async suggestWriting(
    @Body() body: AiWritingAssistanceRequestDto,
  ): Promise<AiWritingAssistanceResponseDto> {
    return this.aiService.suggestWriting(body);
  }
}
