import { Controller, Get, UseGuards, Request, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { QuotaService } from './quota.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quota')
@UseGuards(JwtAuthGuard)
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('status')
  async getMyQuotaStatus(@Request() req) {
    return this.quotaService.getQuotaStatus(req.user.id);
  }

  @Get('admin/all')
  async getAllQuotas() {
    // TODO: Add admin role guard
    return this.quotaService.getAllQuotas();
  }

  @Patch('admin/:userId/limit')
  async updateUserQuota(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('dailyLimit', ParseIntPipe) dailyLimit: number
  ) {
    // TODO: Add admin role guard
    await this.quotaService.updateUserQuota(userId, dailyLimit);
    return { message: 'Quota updated successfully' };
  }
}