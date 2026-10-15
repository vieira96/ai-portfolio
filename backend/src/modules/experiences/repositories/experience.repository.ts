import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import type { ExperienceWithRelations } from '../dto/experience-response.dto.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';

export interface CreateExperienceData {
  data: Prisma.ExperienceCreateInput;
  technologyIds: string[];
}

@Injectable()
export class ExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithRelations(
    input: CreateExperienceData,
    tx?: Prisma.TransactionClient,
  ): Promise<ExperienceWithRelations> {
    const run = async (client: PrismaService | Prisma.TransactionClient) => {
      const experience = await client.experience.create({
        data: input.data,
      });

      if (input.technologyIds.length > 0) {
        await client.experienceTechnology.createMany({
          data: input.technologyIds.map((technologyId) => ({
            experienceId: experience.id,
            technologyId,
          })),
        });
      }

      return client.experience.findUniqueOrThrow({
        where: { id: experience.id },
        include: {
          technologies: { include: { technology: true } },
        },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  findByIdWithRelations(
    id: string,
  ): Promise<ExperienceWithRelations | null> {
    return this.prisma.experience.findUnique({
      where: { id },
      include: {
        technologies: { include: { technology: true } },
      },
    });
  }

  async findAllPaginated(
    page: number,
    size: number,
  ): Promise<{ items: ExperienceWithRelations[]; total: number }> {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.experience.count(),
      this.prisma.experience.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: { startedAt: 'desc' },
        include: {
          technologies: { include: { technology: true } },
        },
      }),
    ]);

    return { items, total };
  }

  updateWithRelations(
    id: string,
    data: Prisma.ExperienceUpdateInput,
    technologyIds?: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<ExperienceWithRelations> {
    const run = async (client: PrismaService | Prisma.TransactionClient) => {
      await client.experience.update({ where: { id }, data });

      if (technologyIds !== undefined) {
        await this.diffTechnologies(client, id, technologyIds);
      }

      return client.experience.findUniqueOrThrow({
        where: { id },
        include: {
          technologies: { include: { technology: true } },
        },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  private async diffTechnologies(
    client: PrismaService | Prisma.TransactionClient,
    experienceId: string,
    newTechnologyIds: string[],
  ): Promise<void> {
    const current = await client.experienceTechnology.findMany({
      where: { experienceId },
      select: { technologyId: true },
    });

    const currentIds = new Set(current.map((row) => row.technologyId));
    const newIds = new Set(newTechnologyIds);

    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await client.experienceTechnology.deleteMany({
        where: { experienceId, technologyId: { in: toRemove } },
      });
    }

    if (toAdd.length > 0) {
      await client.experienceTechnology.createMany({
        data: toAdd.map((technologyId) => ({ experienceId, technologyId })),
      });
    }
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.experience.delete({ where: { id } });
  }
}
