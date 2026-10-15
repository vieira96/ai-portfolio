import { ApiProperty } from '@nestjs/swagger';

export class ChatQueuedResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({ example: 'pending' })
  status: 'pending';

  @ApiProperty({ example: '2026-10-07T12:00:00.000Z' })
  createdAt: Date;
}
