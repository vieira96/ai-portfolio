import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import type { ProjectWithRelations } from '../dto/project-response.dto.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';

export interface CreateProjectData {
  data: Prisma.ProjectCreateInput;
  technologyIds: string[];
}

@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithRelations(
    input: CreateProjectData,
    tx?: Prisma.TransactionClient,
  ): Promise<ProjectWithRelations> {
    const run = async (client: PrismaService | Prisma.TransactionClient) => {
      const project = await client.project.create({ data: input.data });

      if (input.technologyIds.length > 0) {
        await client.projectTechnology.createMany({
          data: input.technologyIds.map((technologyId) => ({
            projectId: project.id,
            technologyId,
          })),
        });
      }

      return client.project.findUniqueOrThrow({
        where: { id: project.id },
        include: { technologies: { include: { technology: true } } },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  findByIdWithRelations(id: string): Promise<ProjectWithRelations | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: { technologies: { include: { technology: true } } },
    });
  }

  async findAllPaginated(
    page: number,
    size: number,
  ): Promise<{ items: ProjectWithRelations[]; total: number }> {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.project.count(),
      this.prisma.project.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { technologies: { include: { technology: true } } },
      }),
    ]);

    return { items, total };
  }

  updateWithRelations(
    id: string,
    data: Prisma.ProjectUpdateInput,
    technologyIds?: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<ProjectWithRelations> {
    const run = async (client: PrismaService | Prisma.TransactionClient) => {
      await client.project.update({ where: { id }, data });

      if (technologyIds !== undefined) {
        await this.diffTechnologies(client, id, technologyIds);
      }

      return client.project.findUniqueOrThrow({
        where: { id },
        include: { technologies: { include: { technology: true } } },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  private async diffTechnologies(
    client: PrismaService | Prisma.TransactionClient,
    projectId: string,
    newTechnologyIds: string[],
  ): Promise<void> {
    const current = await client.projectTechnology.findMany({
      where: { projectId },
      select: { technologyId: true },
    });

    const currentIds = new Set(current.map((row) => row.technologyId));
    const newIds = new Set(newTechnologyIds);

    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await client.projectTechnology.deleteMany({
        where: { projectId, technologyId: { in: toRemove } },
      });
    }

    if (toAdd.length > 0) {
      await client.projectTechnology.createMany({
        data: toAdd.map((technologyId) => ({ projectId, technologyId })),
      });
    }
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.project.delete({ where: { id } });
  }
}
