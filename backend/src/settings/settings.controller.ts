import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { SettingsService } from './settings.service';

class UpdateQuotaSettingDto {
  @IsString()
  key: string;

  @IsNumber()
  @Min(-1)
  value: number;
}

class UpdateSettingDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('MANAGE_SETTINGS')
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Post()
  @RequirePermissions('MANAGE_SETTINGS')
  async createSetting(@Body() dto: UpdateSettingDto) {
    return this.settingsService.createSetting(
      dto.key,
      dto.value,
      dto.type,
      dto.description,
      dto.category,
    );
  }

  @Get('quota')
  @RequirePermissions('MANAGE_QUOTA')
  async getQuotaSettings() {
    return this.settingsService.getQuotaSettings();
  }

  @Put('quota')
  @RequirePermissions('MANAGE_QUOTA')
  async updateQuotaSetting(@Body() dto: UpdateQuotaSettingDto) {
    await this.settingsService.updateQuotaSetting(dto.key, dto.value);
    return { message: 'Quota setting updated successfully' };
  }

  @Get('category/:category')
  @RequirePermissions('MANAGE_SETTINGS')
  async getSettingsByCategory(@Param('category') category: string) {
    return this.settingsService.getSettingsByCategory(category);
  }

  @Get(':key')
  @RequirePermissions('MANAGE_SETTINGS')
  async getSetting(@Param('key') key: string) {
    const setting = await this.settingsService.getSetting(key);
    if (!setting) {
      throw new HttpException('Setting not found', HttpStatus.NOT_FOUND);
    }
    return setting;
  }

  @Put(':key')
  @RequirePermissions('MANAGE_SETTINGS')
  async updateSetting(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(
      key,
      dto.value,
      dto.type,
      dto.description,
      dto.category,
    );
  }

  @Delete(':key')
  @RequirePermissions('MANAGE_SETTINGS')
  async deleteSetting(@Param('key') key: string) {
    try {
      await this.settingsService.deleteSetting(key);
      return { message: 'Setting deleted successfully' };
    } catch (error) {
      throw new HttpException('Setting not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('initialize-quota')
  @RequirePermissions('MANAGE_QUOTA')
  async initializeQuotaSettings() {
    await this.settingsService.initializeQuotaSettings();
    return { message: 'Quota settings initialized successfully' };
  }
}