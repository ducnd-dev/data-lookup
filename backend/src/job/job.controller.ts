import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { JobSeederService } from './job-seeder.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobSeederService: JobSeederService,
  ) {}

  @Post()
  @RequirePermissions('job:create')
  create(@Body() createJobDto: CreateJobDto, @Req() req: any) {
    return this.jobService.create(createJobDto, req.user.userId);
  }

  @Get()
  @RequirePermissions('job:read')
  findAll(@Query() query: any) {
    return this.jobService.findAll(query);
  }
  
  @Get('stats')
  @RequirePermissions('job:read')
  getStats() {
    return this.jobService.getStats();
  }

  @Get(':id')
  @RequirePermissions('job:read')
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('job:update')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobService.update(id, updateJobDto);
  }

  @Delete(':id')
  @RequirePermissions('job:delete')
  remove(@Param('id') id: string) {
    return this.jobService.remove(id);
  }

  @Post(':id/cancel')
  @RequirePermissions('job:update')
  cancel(@Param('id') id: string) {
    return this.jobService.cancel(id);
  }

  @Post(':id/retry')
  @RequirePermissions('job:update')
  retry(@Param('id') id: string) {
    return this.jobService.retry(id);
  }

  @Get(':id/logs')
  @RequirePermissions('job:read')
  getLogs(@Param('id') id: string) {
    return this.jobService.getLogs(id);
  }

  @Get('templates/list')
  @RequirePermissions('job:read')
  getJobTemplates() {
    return {
      success: true,
      data: this.jobSeederService.getJobTemplates(),
    };
  }

  @Get('templates/quickstart')
  @RequirePermissions('job:read')
  getQuickStartJobs() {
    return {
      success: true,
      data: this.jobSeederService.getQuickStartJobs(),
    };
  }

  @Post('templates/seed')
  @RequirePermissions('job:create')
  async seedDefaultJobs() {
    await this.jobSeederService.seedDefaultJobs();
    return {
      success: true,
      message: 'Default jobs seeded successfully',
    };
  }

  @Post('templates/create')
  @RequirePermissions('job:create')
  async createFromTemplate(
    @Body() body: { templateId: string; name?: string },
    @Req() req: any,
  ) {
    const templates = this.jobSeederService.getJobTemplates();
    const template = templates.find((t) => t.id === body.templateId);

    if (!template) {
      return {
        success: false,
        error: 'Template not found',
      };
    }

    const jobData: CreateJobDto = {
      name: body.name || template.name,
      jobType: template.type,
      description: template.description,
    };

    const result = await this.jobService.create(jobData, req.user.userId);
    return {
      success: true,
      data: result,
      message: `Job created from template: ${template.name}`,
    };
  }

  @Post('quickstart/:action')
  @RequirePermissions('job:create')
  async executeQuickStartAction(
    @Param('action') action: string,
    @Req() req: any,
  ) {
    const quickStartJobs = this.jobSeederService.getQuickStartJobs();
    const quickJob = quickStartJobs.find((j) => j.action === action);

    if (!quickJob) {
      return {
        success: false,
        error: 'Quick start action not found',
      };
    }

    const jobData: CreateJobDto = {
      name: quickJob.name,
      jobType: quickJob.type,
      description: quickJob.description,
    };

    const result = await this.jobService.create(jobData, req.user.userId);
    return {
      success: true,
      data: result,
      message: `Quick start job created: ${quickJob.name}`,
    };
  }
}