import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiHealthResponseDto } from '../dto/ai-health-response.dto.js';
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
}
