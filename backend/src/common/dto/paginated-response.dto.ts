import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<TData> {
  @ApiProperty({ isArray: true })
  data: TData[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 11 })
  totalPages: number;
}
