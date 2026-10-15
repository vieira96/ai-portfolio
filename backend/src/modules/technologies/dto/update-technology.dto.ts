import { PartialType } from '@nestjs/mapped-types';
import { CreateTechnologyDto } from './create-technology.dto.js';

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {}
