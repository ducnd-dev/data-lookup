import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  DashboardStats, 
  ActivityItem, 
  ChartDataPoint, 
  QuickStats 
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Get current counts
    const [totalUsers, dataRecords, activeJobs, uploadsToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.lookupData.count(),
      this.prisma.jobStatus.count({
        where: {
          status: {
            in: ['pending', 'processing']
          }
        }
      }),
      this.prisma.jobStatus.count({
        where: {
          createdAt: {
            gte: today
          },
          jobType: 'data_import'
        }
      })
    ]);

    // Get last month counts for growth calculation
    const [usersLastMonth, recordsLastMonth, uploadsYesterday] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            lt: lastMonth
          }
        }
      }),
      this.prisma.lookupData.count({
        where: {
          createdAt: {
            lt: lastMonth
          }
        }
      }),
      this.prisma.jobStatus.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          },
          jobType: 'data_import'
        }
      })
    ]);

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0 ? ((totalUsers - usersLastMonth) / usersLastMonth) * 100 : 0;
    const recordGrowth = recordsLastMonth > 0 ? ((dataRecords - recordsLastMonth) / recordsLastMonth) * 100 : 0;
    const uploadGrowth = uploadsYesterday > 0 ? ((uploadsToday - uploadsYesterday) / uploadsYesterday) * 100 : 0;

    return {
      totalUsers,
      activeJobs,
      dataRecords,
      uploadsToday,
      userGrowth: Math.round(userGrowth * 100) / 100,
      jobGrowth: 8, // Mock data for now
      recordGrowth: Math.round(recordGrowth * 100) / 100,
      uploadGrowth: Math.round(uploadGrowth * 100) / 100
    };
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    // Get recent jobs
    const recentJobs = await this.prisma.jobStatus.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user details separately
    const userIds = [...new Set(recentJobs.map(job => job.createdBy))];
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    const userMap = new Map(users.map(user => [user.id, user]));

    // Transform to activity items
    const activities: ActivityItem[] = recentJobs.map(job => {
      let title = '';
      let description = '';
      let type: 'user' | 'job' | 'upload' | 'system' = 'job';

      switch (job.jobType) {
        case 'data_import':
          title = 'Data upload completed';
          description = `${job.fileName || 'Data file'} processed successfully`;
          type = 'upload';
          break;
        case 'generate_report':
          title = 'Report generated';
          description = 'Background report generation completed';
          type = 'job';
          break;
        default:
          title = 'Job completed';
          description = `Background job ${job.id} completed`;
          type = 'job';
      }

      const user = userMap.get(job.createdBy);

      return {
        id: job.id,
        title,
        description,
        type,
        timestamp: job.createdAt,
        userId: job.createdBy,
        userName: user?.fullName || 'Unknown User',
        status: job.status
      };
    });

    return activities;
  }

  async getChartData(period: string): Promise<ChartDataPoint[]> {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'day';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        dateFormat = 'month';
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        dateFormat = 'month';
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateFormat = 'day';
    }

    // Get job counts grouped by date
    const jobCounts = await this.prisma.jobStatus.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by date and count
    const dateGroups: { [key: string]: number } = {};
    
    jobCounts.forEach(job => {
      const date = job.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

    // Convert to chart data
    const chartData: ChartDataPoint[] = Object.entries(dateGroups).map(([date, count]) => ({
      date,
      value: count,
      label: new Date(date).toLocaleDateString()
    }));

    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getQuickStats(): Promise<{ [key: string]: number }> {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      completedJobsToday,
      failedJobsToday,
      newUsersThisWeek,
      totalDataSize
    ] = await Promise.all([
      this.prisma.jobStatus.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      }),
      this.prisma.jobStatus.count({
        where: {
          status: 'failed',
          updatedAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: thisWeek
          }
        }
      }),
      this.prisma.lookupData.count()
    ]);

    return {
      completedJobsToday,
      failedJobsToday,
      newUsersThisWeek,
      totalDataSize
    };
  }
}