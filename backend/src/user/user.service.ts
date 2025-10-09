import { Injectable } from '@nestjs/common';
import { PaginationResult } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10): Promise<PaginationResult<any>> {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page), 10) || 1);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100 // Giới hạn tối đa
    );
    const skip = (actualPage - 1) * actualLimit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: actualLimit,
        include: { 
          roles: { 
            include: { 
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              } 
            } 
          } 
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return new PaginationResult(users, total, actualPage, actualLimit);
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { 
        roles: { 
          include: { 
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            } 
          } 
        } 
      },
    });
  }

  async assignRole(userId: number, roleId: number) {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  async removeRole(userId: number, roleId: number) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async toggleStatus(id: number) {
    // First get the current user status
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Toggle the status
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { 
        roles: { 
          include: { 
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            } 
          } 
        } 
      },
    });
  }

  async update(id: number, updateData: any) {
    const { roleIds, ...userData } = updateData;

    // Start a transaction to update user and roles
    return this.prisma.$transaction(async (prisma) => {
      // Update user basic info
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData,
      });

      // Update roles if provided
      if (roleIds !== undefined) {
        // Remove all existing roles
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // Add new roles
        if (roleIds.length > 0) {
          await prisma.userRole.createMany({
            data: roleIds.map((roleId: number) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }

      // Return updated user with roles
      return prisma.user.findUnique({
        where: { id },
        include: { 
          roles: { 
            include: { 
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              } 
            } 
          } 
        },
      });
    });
  }

  async exportUsers(page: number = 1, limit: number = 1000) {
    // Parse và validate tham số phân trang
    const actualPage = Math.max(1, parseInt(String(page), 10) || 1);
    const actualLimit = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 1000),
      5000 // Giới hạn tối đa cho export
    );
    
    // Get users data for export
    const users = await this.prisma.user.findMany({
      skip: (actualPage - 1) * actualLimit,
      take: actualLimit,
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for Excel export
    const exportData = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map(ur => ur.role.name).join(', '),
      createdAt: user.createdAt.toISOString(),
    }));

    return {
      data: exportData,
      total: users.length,
      message: 'Users data ready for export',
    };
  }
}