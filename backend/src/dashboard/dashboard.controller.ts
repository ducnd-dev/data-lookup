import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { 
  DashboardStats, 
  ActivityItem, 
  ChartDataPoint 
} from './dashboard.types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @RequirePermissions('READ_USERS')
  async getStats(): Promise<DashboardStats> {
    return await this.dashboardService.getStats();
  }

  @Get('activities')
  @RequirePermissions('READ_USERS')
  async getRecentActivities(@Query('limit') limit?: string): Promise<ActivityItem[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.dashboardService.getRecentActivities(limitNum);
  }

  @Get('chart-data')
  @RequirePermissions('READ_USERS')
  async getChartData(@Query('period') period?: string): Promise<ChartDataPoint[]> {
    return await this.dashboardService.getChartData(period || 'month');
  }

  @Get('quick-stats')
  @RequirePermissions('READ_USERS')
  async getQuickStats(): Promise<{ [key: string]: number }> {
    return await this.dashboardService.getQuickStats();
  }

  @Get('test')
  getTest(): { message: string; timestamp: Date } {
    return { message: 'Dashboard API is working!', timestamp: new Date() };
  }
}