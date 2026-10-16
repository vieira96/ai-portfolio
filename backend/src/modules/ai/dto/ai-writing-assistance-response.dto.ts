import { ApiProperty } from '@nestjs/swagger';

export class AiWritingAssistanceResponseDto {
  @ApiProperty({ example: 'Texto revisado com clareza e precisão.' })
  suggestion: string;
}
