import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import type { Education } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';

@Injectable()
export class EducationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EducationCreateInput): Promise<Education> {
    return this.prisma.education.create({ data });
  }

  findById(id: string): Promise<Education | null> {
    return this.prisma.education.findUnique({ where: { id } });
  }

  async findAllPaginated(
    page: number,
    size: number,
  ): Promise<{ items: Education[]; total: number }> {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.education.count(),
      this.prisma.education.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return { items, total };
  }

  update(id: string, data: Prisma.EducationUpdateInput): Promise<Education> {
    return this.prisma.education.update({ where: { id }, data });
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.education.delete({ where: { id } });
  }
}
