import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  Prisma,
  TechnologyCategory,
} from '../../../generated/prisma/client.js';
import { CreateTechnologyDto } from '../dto/create-technology.dto.js';
import { TechnologyResponseDto } from '../dto/technology-response.dto.js';
import { UpdateTechnologyDto } from '../dto/update-technology.dto.js';
import { TechnologyRepository } from '../repositories/technology.repository.js';

@Injectable()
export class TechnologiesService {
  constructor(
    private readonly technologyRepository: TechnologyRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TechnologiesService.name);
  }

  async create(
    createTechnologyDto: CreateTechnologyDto,
  ): Promise<TechnologyResponseDto> {
    const existing = await this.technologyRepository.findByName(
      createTechnologyDto.name,
    );

    if (existing !== null) {
      throw new ConflictException('Technology already exists');
    }

    this.logger.info({ name: createTechnologyDto.name });
    const technology = await this.technologyRepository.create(
      createTechnologyDto,
    );
    return TechnologyResponseDto.from(technology);
  }

  async findAll(): Promise<TechnologyResponseDto[]> {
    const technologies = await this.technologyRepository.findAll();
    return technologies.map((technology) =>
      TechnologyResponseDto.from(technology),
    );
  }

  async update(
    id: string,
    updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<TechnologyResponseDto> {
    const technology = await this.technologyRepository.findById(id);

    if (technology === null) {
      throw new NotFoundException('Technology not found');
    }

    if (
      updateTechnologyDto.name !== undefined &&
      updateTechnologyDto.name !== technology.name
    ) {
      const existing = await this.technologyRepository.findByName(
        updateTechnologyDto.name,
      );

      if (existing !== null) {
        throw new ConflictException('Technology already exists');
      }
    }

    const updated = await this.technologyRepository.update(
      id,
      updateTechnologyDto,
    );
    return TechnologyResponseDto.from(updated);
  }

  async delete(id: string): Promise<void> {
    const technology = await this.technologyRepository.findById(id);

    if (technology === null) {
      throw new NotFoundException('Technology not found');
    }

    await this.technologyRepository.delete(id);
  }

  async resolveTechnologyIds(
    skills: Array<{
      id?: string;
      name: string;
      category: TechnologyCategory;
    }>,
    tx: Prisma.TransactionClient,
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const skill of skills) {
      if (skill.id !== undefined) {
        ids.push(skill.id);
        continue;
      }

      const upserted = await tx.technology.upsert({
        where: { name: skill.name },
        create: { name: skill.name, category: skill.category },
        update: {},
      });
      ids.push(upserted.id);
    }

    return ids;
  }
}
