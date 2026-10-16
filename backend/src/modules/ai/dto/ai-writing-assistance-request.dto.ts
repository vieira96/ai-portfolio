import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const AI_WRITING_FIELD_TYPES = [
  'bio',
  'headline',
  'experienceDescription',
  'projectDescription',
] as const;

export type AiWritingFieldType = (typeof AI_WRITING_FIELD_TYPES)[number];

export class AiWritingAssistanceRequestDto {
  @ApiProperty({ enum: AI_WRITING_FIELD_TYPES })
  @IsIn([...AI_WRITING_FIELD_TYPES])
  fieldType: AiWritingFieldType;

  @ApiProperty({ minLength: 1, maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(10000)
  text: string;
}
