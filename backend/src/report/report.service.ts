import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getUserStats() {
    const totalUsers = await this.prisma.user.count();
    const usersByRole = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      _count: true,
    });
    
    return {
      totalUsers,
      usersByRole,
    };
  }

  async getSystemStats() {
    return {
      totalUsers: await this.prisma.user.count(),
      totalRoles: await this.prisma.role.count(),
      totalPermissions: await this.prisma.permission.count(),
    };
  }
}