import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('users')
  @Roles('admin')
  getUserStats() {
    return this.reportService.getUserStats();
  }

  @Get('system')
  @Roles('admin')
  getSystemStats() {
    return this.reportService.getSystemStats();
  }
}