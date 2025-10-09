import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobSeederService {
  constructor(private prisma: PrismaService) {}

  async seedDefaultJobs() {
    // Check if default jobs already exist
    const existingJobs = await this.prisma.jobStatus.count({
      where: {
        jobType: {
          in: [
            'system_maintenance',
            'daily_backup',
            'data_cleanup',
            'report_generation',
          ],
        },
      },
    });

    if (existingJobs > 0) {
      console.log('Default jobs already exist, skipping seed...');
      return;
    }

    const defaultJobs = [
      {
        id: 'job-daily-backup',
        jobType: 'daily_backup',
        status: 'pending',
        fileName: 'Daily Data Backup',
        createdBy: 1, // System user
        totalRows: 0,
        processedRows: 0,
      },
      {
        id: 'job-system-maintenance',
        jobType: 'system_maintenance',
        status: 'pending',
        fileName: 'System Maintenance',
        createdBy: 1,
        totalRows: 0,
        processedRows: 0,
      },
      {
        id: 'job-data-cleanup',
        jobType: 'data_cleanup',
        status: 'pending',
        fileName: 'Data Cleanup',
        createdBy: 1,
        totalRows: 0,
        processedRows: 0,
      },
      {
        id: 'job-weekly-report',
        jobType: 'report_generation',
        status: 'pending',
        fileName: 'Weekly Analytics Report',
        createdBy: 1,
        totalRows: 0,
        processedRows: 0,
      },
      {
        id: 'job-data-validation',
        jobType: 'data_validation',
        status: 'pending',
        fileName: 'Data Quality Check',
        createdBy: 1,
        totalRows: 0,
        processedRows: 0,
      },
      {
        id: 'job-bulk-import-template',
        jobType: 'bulk_import',
        status: 'completed',
        fileName: 'Sample Bulk Import Job',
        createdBy: 1,
        totalRows: 1000,
        processedRows: 1000,
        resultPath: 'sample_import_result.xlsx',
      },
      {
        id: 'job-lookup-template',
        jobType: 'lookup_search',
        status: 'completed',
        fileName: 'Sample Lookup Search',
        createdBy: 1,
        totalRows: 500,
        processedRows: 500,
        resultPath: 'sample_lookup_result.xlsx',
      },
      {
        id: 'job-export-template',
        jobType: 'data_export',
        status: 'completed',
        fileName: 'Sample Data Export',
        createdBy: 1,
        totalRows: 2000,
        processedRows: 2000,
        resultPath: 'sample_export_result.xlsx',
      },
    ];

    try {
      await this.prisma.jobStatus.createMany({
        data: defaultJobs,
        skipDuplicates: true,
      });

      console.log(`✅ Seeded ${defaultJobs.length} default jobs successfully`);
    } catch (error) {
      console.error('❌ Failed to seed default jobs:', error);
    }
  }

  async createJobTemplate(
    jobType: string,
    name: string,
    description: string,
    userId: number = 1,
  ) {
    return await this.prisma.jobStatus.create({
      data: {
        jobType,
        status: 'pending',
        fileName: name,
        createdBy: userId,
        totalRows: 0,
        processedRows: 0,
      },
    });
  }

  getJobTemplates() {
    return [
      {
        id: 'template-data-import',
        name: 'Data Import Job',
        type: 'import',
        description: 'Import data from CSV/Excel files into the system',
        estimatedTime: '5-30 minutes',
        features: [
          'Batch processing',
          'Error handling',
          'Progress tracking',
        ],
        icon: 'CloudUpload',
      },
      {
        id: 'template-bulk-search',
        name: 'Bulk Search Job',
        type: 'search',
        description: 'Search multiple terms across lookup data',
        estimatedTime: '2-15 minutes',
        features: [
          'Multiple search modes',
          'Cross-column search',
          'Result export',
        ],
        icon: 'Search',
      },
      {
        id: 'template-data-export',
        name: 'Data Export Job',
        type: 'export',
        description: 'Export lookup data to Excel/CSV format',
        estimatedTime: '1-10 minutes',
        features: [
          'Multiple formats',
          'Custom filtering',
          'Large dataset support',
        ],
        icon: 'Download',
      },
      {
        id: 'template-report-generation',
        name: 'Report Generation',
        type: 'analysis',
        description: 'Generate analytics and summary reports',
        estimatedTime: '3-20 minutes',
        features: [
          'Multiple charts',
          'Statistical analysis',
          'Scheduled reports',
        ],
        icon: 'Analytics',
      },
      {
        id: 'template-data-sync',
        name: 'Data Synchronization',
        type: 'sync',
        description: 'Sync data with external systems',
        estimatedTime: '10-60 minutes',
        features: [
          'Two-way sync',
          'Conflict resolution',
          'Incremental updates',
        ],
        icon: 'Sync',
      },
      {
        id: 'template-data-cleanup',
        name: 'Data Cleanup',
        type: 'processing',
        description: 'Clean and validate data quality',
        estimatedTime: '5-45 minutes',
        features: [
          'Duplicate removal',
          'Data validation',
          'Format standardization',
        ],
        icon: 'CleaningServices',
      },
    ];
  }

  getQuickStartJobs() {
    return [
      {
        id: 'quick-sample-import',
        name: 'Import Sample Data',
        description: 'Import sample lookup data to get started',
        type: 'import',
        action: 'import_sample',
        estimatedTime: '2 minutes',
        sampleData: true,
      },
      {
        id: 'quick-test-search',
        name: 'Test Search Function',
        description: 'Test search functionality with sample queries',
        type: 'search',
        action: 'test_search',
        estimatedTime: '1 minute',
        sampleData: true,
      },
      {
        id: 'quick-export-demo',
        name: 'Export Demo Report',
        description: 'Generate a demo export to see the output format',
        type: 'export',
        action: 'demo_export',
        estimatedTime: '1 minute',
        sampleData: true,
      },
    ];
  }
}