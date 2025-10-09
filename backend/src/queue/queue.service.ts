import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('file') private fileQueue: Queue) {}

  async addMergeFileJob(data: any) {
    return this.fileQueue.add('merge-file', data, {
      delay: 1000, // Wait 1 second before processing
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addEmailJob(data: any) {
    return this.fileQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addDataImportJob(data: any) {
    const job = await this.fileQueue.add('data-import', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return job.id;
  }

  async addReportJob(data: any) {
    const job = await this.fileQueue.add('generate-report', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return job.id;
  }

  async addBulkSearchReportJob(data: any) {
    const job = await this.fileQueue.add('generate-bulk-search-report', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return job.id;
  }

  async getJobStatus(jobId: string) {
    const job = await this.fileQueue.getJob(jobId);
    if (!job) return null;
    
    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      state: await job.getState(),
    };
  }
}