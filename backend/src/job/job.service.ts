import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, status, jobType, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (jobType) {
      where.jobType = jobType;
    }
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { jobType: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.jobStatus.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder }
      }),
      this.prisma.jobStatus.count({ where })
    ]);

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.fileName || job.jobType,
        type: job.jobType,
        status: job.status,
        description: `${job.jobType} job`,
        progress: this.calculateProgress(job),
        startTime: job.createdAt.toISOString(),
        endTime: job.updatedAt !== job.createdAt ? job.updatedAt.toISOString() : null,
        createdBy: job.createdBy.toString(),
        result: {
          recordsProcessed: job.processedRows || 0,
          recordsSuccessful: job.status === 'completed' ? job.processedRows || 0 : 0,
          recordsFailed: job.status === 'failed' ? job.totalRows || 0 : 0,
          outputFile: job.resultPath,
          errorMessage: job.errorMsg
        },
        metadata: {
          fileName: job.fileName,
          totalRows: job.totalRows
        },
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString()
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.jobStatus.findUnique({
      where: { id }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      name: job.fileName || job.jobType,
      type: job.jobType,
      status: job.status,
      description: `${job.jobType} job`,
      progress: this.calculateProgress(job),
      startTime: job.createdAt.toISOString(),
      endTime: job.updatedAt !== job.createdAt ? job.updatedAt.toISOString() : null,
      createdBy: job.createdBy.toString(),
      result: {
        recordsProcessed: job.processedRows || 0,
        recordsSuccessful: job.status === 'completed' ? job.processedRows || 0 : 0,
        recordsFailed: job.status === 'failed' ? job.totalRows || 0 : 0,
        outputFile: job.resultPath,
        errorMessage: job.errorMsg
      },
      metadata: {
        fileName: job.fileName,
        totalRows: job.totalRows
      },
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString()
    };
  }

  async create(createJobDto: CreateJobDto, userId: number) {
    const job = await this.prisma.jobStatus.create({
      data: {
        jobType: createJobDto.jobType,
        status: 'pending',
        fileName: createJobDto.fileName,
        createdBy: userId
      }
    });

    return this.findOne(job.id);
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const job = await this.prisma.jobStatus.update({
      where: { id },
      data: updateJobDto
    });

    return this.findOne(job.id);
  }

  async remove(id: string) {
    await this.prisma.jobStatus.delete({
      where: { id }
    });
    
    return { message: 'Job deleted successfully' };
  }

  async cancel(id: string) {
    const job = await this.prisma.jobStatus.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    return this.findOne(job.id);
  }

  async retry(id: string) {
    const job = await this.prisma.jobStatus.update({
      where: { id },
      data: { 
        status: 'pending',
        errorMsg: null,
        processedRows: 0
      }
    });

    return this.findOne(job.id);
  }

  async getStats() {
    const [totalJobs, statusCounts, typeCounts] = await Promise.all([
      this.prisma.jobStatus.count(),
      this.prisma.jobStatus.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.jobStatus.groupBy({
        by: ['jobType'],
        _count: { jobType: true }
      })
    ]);

    const recentJobs = await this.prisma.jobStatus.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const byType = typeCounts.reduce((acc, item) => {
      acc[item.jobType] = item._count.jobType;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all status keys exist
    ['pending', 'processing', 'completed', 'failed', 'cancelled'].forEach(status => {
      if (!byStatus[status]) byStatus[status] = 0;
    });

    return {
      total: totalJobs,
      byStatus,
      byType,
      recent: recentJobs.map(job => ({
        id: job.id,
        name: job.fileName || job.jobType,
        type: job.jobType,
        status: job.status,
        createdAt: job.createdAt.toISOString()
      })),
      activeJobs: byStatus.pending + byStatus.processing
    };
  }

  async getLogs(id: string) {
    const job = await this.prisma.jobStatus.findUnique({
      where: { id }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // For now, return basic logs. In the future, this could read from log files
    const logs = [
      `Job ${job.id} created at ${job.createdAt.toISOString()}`,
      `Job type: ${job.jobType}`,
      `Status: ${job.status}`,
    ];

    if (job.fileName) {
      logs.push(`File: ${job.fileName}`);
    }

    if (job.totalRows) {
      logs.push(`Total rows: ${job.totalRows}`);
    }

    if (job.processedRows) {
      logs.push(`Processed rows: ${job.processedRows}`);
    }

    if (job.errorMsg) {
      logs.push(`Error: ${job.errorMsg}`);
    }

    logs.push(`Last updated: ${job.updatedAt.toISOString()}`);

    return {
      logs,
      timestamp: new Date().toISOString()
    };
  }

  private calculateProgress(job: any): number {
    if (job.status === 'completed') return 100;
    if (job.status === 'failed' || job.status === 'cancelled') return 0;
    if (job.status === 'pending') return 0;
    
    if (job.totalRows && job.processedRows) {
      return Math.round((job.processedRows / job.totalRows) * 100);
    }
    
    return job.status === 'processing' ? 50 : 0;
  }
}