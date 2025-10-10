import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.permission.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: permissions,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: number) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async create(name: string, description?: string) {
    return this.prisma.permission.create({
      data: {
        name,
        description,
      },
    });
  }

  async update(id: number, name?: string, description?: string) {
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });
  }

  async delete(id: number) {
    return this.prisma.permission.delete({
      where: { id },
    });
  }

  async search(query: string, page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.permission.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: permissions,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}