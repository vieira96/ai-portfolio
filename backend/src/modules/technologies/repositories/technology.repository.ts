import { Injectable } from '@nestjs/common';
import { Prisma, Technology } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';

@Injectable()
export class TechnologyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TechnologyCreateInput): Promise<Technology> {
    return this.prisma.technology.create({ data });
  }

  findAll(): Promise<Technology[]> {
    return this.prisma.technology.findMany({
      orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string): Promise<Technology | null> {
    return this.prisma.technology.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Technology | null> {
    return this.prisma.technology.findUnique({ where: { name } });
  }

  update(id: string, data: Prisma.TechnologyUpdateInput): Promise<Technology> {
    return this.prisma.technology.update({ where: { id }, data });
  }

  delete(id: string): Promise<Technology> {
    return this.prisma.technology.delete({ where: { id } });
  }
}
