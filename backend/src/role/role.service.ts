import { Injectable } from '@nestjs/common';
import { PaginationResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, description?: string) {
    return this.prisma.role.create({
      data: { name, description },
    });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginationResult<any>> {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page), 10) || 1);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;
    
    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: actualLimit,
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.role.count(),
    ]);

    return new PaginationResult(roles, total, actualPage, actualLimit);
  }

  async findOne(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async update(id: number, name?: string, description?: string) {
    return this.prisma.role.update({
      where: { id },
      data: { ...(name && { name }), ...(description && { description }) },
    });
  }

  async delete(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }

  async assignPermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  async removePermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}