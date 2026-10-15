import { ApiProperty } from '@nestjs/swagger';

export class AiHealthResponseDto {
  @ApiProperty({ enum: ['ok', 'unavailable'], example: 'ok' })
  status: 'ok' | 'unavailable';

  @ApiProperty({ example: 'qwen2.5:7b' })
  model: string;
}
