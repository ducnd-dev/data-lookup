import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuotaSettings {
  USER_DAILY_LIMIT: number;
  MANAGER_DAILY_LIMIT: number;
  ADMIN_DAILY_LIMIT: number; // -1 for unlimited
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialize default quota settings if they don't exist
   */
  async initializeQuotaSettings() {
    const defaultSettings = [
      {
        key: 'USER_DAILY_LIMIT',
        value: '100',
        type: 'number',
        description: 'Daily API quota limit for User role',
        category: 'quota'
      },
      {
        key: 'MANAGER_DAILY_LIMIT',
        value: '1000',
        type: 'number',
        description: 'Daily API quota limit for Manager role',
        category: 'quota'
      },
      {
        key: 'ADMIN_DAILY_LIMIT',
        value: '-1',
        type: 'number',
        description: 'Daily API quota limit for Admin role (-1 = unlimited)',
        category: 'quota'
      }
    ];

    for (const setting of defaultSettings) {
      await this.prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }
  }

  /**
   * Get quota settings for all roles
   */
  async getQuotaSettings(): Promise<QuotaSettings> {
    const settings = await this.prisma.systemSettings.findMany({
      where: { category: 'quota' }
    });

    const quotaSettings: any = {};
    for (const setting of settings) {
      quotaSettings[setting.key] = parseInt(setting.value);
    }

    return quotaSettings as QuotaSettings;
  }

  /**
   * Update quota setting for a specific role
   */
  async updateQuotaSetting(key: string, value: number): Promise<void> {
    const validKeys = ['USER_DAILY_LIMIT', 'MANAGER_DAILY_LIMIT', 'ADMIN_DAILY_LIMIT'];
    
    if (!validKeys.includes(key)) {
      throw new HttpException('Invalid quota setting key', HttpStatus.BAD_REQUEST);
    }

    if (value < -1) {
      throw new HttpException('Quota value must be -1 (unlimited) or positive number', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.systemSettings.upsert({
      where: { key },
      update: { value: value.toString() },
      create: {
        key,
        value: value.toString(),
        type: 'number',
        description: `Daily API quota limit for ${key.replace('_DAILY_LIMIT', '')} role`,
        category: 'quota'
      }
    });
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    return this.prisma.systemSettings.findMany({
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Create new setting
   */
  async createSetting(key: string, value: string, type: string = 'string', description?: string, category: string = 'general') {
    return this.prisma.systemSettings.create({
      data: {
        key,
        value,
        type,
        description,
        category
      }
    });
  }

  /**
   * Get all settings by category
   */
  async getSettingsByCategory(category: string) {
    return this.prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Get setting by key
   */
  async getSetting(key: string) {
    return this.prisma.systemSettings.findUnique({
      where: { key }
    });
  }

  /**
   * Update any setting
   */
  async updateSetting(key: string, value: string, type: string = 'string', description?: string, category: string = 'general') {
    return this.prisma.systemSettings.upsert({
      where: { key },
      update: { 
        value,
        type,
        description,
        category
      },
      create: {
        key,
        value,
        type,
        description,
        category
      }
    });
  }

  /**
   * Delete setting
   */
  async deleteSetting(key: string) {
    return this.prisma.systemSettings.delete({
      where: { key }
    });
  }
}