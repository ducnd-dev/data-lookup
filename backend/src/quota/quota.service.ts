import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class QuotaService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Get role-based quota limits from settings
   */
  private async getRoleQuotas() {
    const settings = await this.settingsService.getQuotaSettings();
    return {
      User: settings.USER_DAILY_LIMIT,
      Manager: settings.MANAGER_DAILY_LIMIT,
      Admin: settings.ADMIN_DAILY_LIMIT,
    };
  }

  /**
   * Get or create user quota
   */
  async getUserQuota(userId: number) {
    let quota = await this.prisma.apiQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      // Get user's highest role to determine quota
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Get dynamic quota settings
      const roleQuotas = await this.getRoleQuotas();

      // Determine quota based on highest role
      let dailyLimit = roleQuotas.User; // default
      
      if (user.roles && user.roles.length > 0) {
        const roles = user.roles.map((ur) => ur.role.name);
        
        if (roles.includes('Admin')) {
          dailyLimit = roleQuotas.Admin;
        } else if (roles.includes('Manager')) {
          dailyLimit = roleQuotas.Manager;
        }
      }

      // Create quota record
      quota = await this.prisma.apiQuota.create({
        data: {
          userId,
          dailyLimit,
          dailyUsed: 0,
          lastResetDate: new Date(),
        },
      });
    }

    return quota;
  }

  /**
   * Check if user has quota remaining
   */
  async checkQuota(userId: number, requestSize: number = 1): Promise<boolean> {
    const quota = await this.getUserQuota(userId);
    
    // Check if reset is needed (new day)
    const today = new Date();
    const lastReset = new Date(quota.lastResetDate);
    
    if (today.getDate() !== lastReset.getDate() || 
        today.getMonth() !== lastReset.getMonth() || 
        today.getFullYear() !== lastReset.getFullYear()) {
      
      // Reset daily usage
      await this.prisma.apiQuota.update({
        where: { userId },
        data: {
          dailyUsed: 0,
          lastResetDate: today,
        },
      });
      
      quota.dailyUsed = 0;
    }

    // Check quota (unlimited if dailyLimit is -1)
    if (quota.dailyLimit === -1) {
      return true;
    }

    return quota.dailyUsed + requestSize <= quota.dailyLimit;
  }

  /**
   * Update usage after successful lookup
   */
  async updateUsage(userId: number, requestSize: number = 1): Promise<void> {
    const quota = await this.getUserQuota(userId);
    
    await this.prisma.apiQuota.update({
      where: { userId },
      data: {
        dailyUsed: quota.dailyUsed + requestSize,
      },
    });
  }

  /**
   * Get quota status for user
   */
  async getQuotaStatus(userId: number) {
    const quota = await this.getUserQuota(userId);
    
    // Check if reset is needed
    const today = new Date();
    const lastReset = new Date(quota.lastResetDate);
    
    if (today.getDate() !== lastReset.getDate() || 
        today.getMonth() !== lastReset.getMonth() || 
        today.getFullYear() !== lastReset.getFullYear()) {
      
      await this.prisma.apiQuota.update({
        where: { userId },
        data: {
          dailyUsed: 0,
          lastResetDate: today,
        },
      });
      
      return {
        dailyLimit: quota.dailyLimit,
        dailyUsed: 0,
        remaining: quota.dailyLimit === -1 ? -1 : quota.dailyLimit,
        resetTime: this.getNextResetTime(),
        unlimited: quota.dailyLimit === -1,
      };
    }

    return {
      dailyLimit: quota.dailyLimit,
      dailyUsed: quota.dailyUsed,
      remaining: quota.dailyLimit === -1 ? -1 : quota.dailyLimit - quota.dailyUsed,
      resetTime: this.getNextResetTime(),
      unlimited: quota.dailyLimit === -1,
    };
  }

  /**
   * Admin: Update user quota
   */
  async updateUserQuota(userId: number, dailyLimit: number) {
    await this.prisma.apiQuota.upsert({
      where: { userId },
      update: { dailyLimit },
      create: {
        userId,
        dailyLimit,
        dailyUsed: 0,
        lastResetDate: new Date(),
      },
    });
  }

  /**
   * Get next reset time (start of next day)
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Admin: Get all user quotas
   */
  async getAllQuotas(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [quotas, total] = await Promise.all([
      this.prisma.apiQuota.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.apiQuota.count(),
    ]);

    return {
      data: quotas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}