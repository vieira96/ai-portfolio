import { PartialType } from '@nestjs/mapped-types';
import { CreateExperienceDto } from './create-experience.dto.js';

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
