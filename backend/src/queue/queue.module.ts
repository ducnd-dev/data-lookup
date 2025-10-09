import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { FileProcessor } from './file.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        connectTimeout: 10000,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
    BullModule.registerQueue({
      name: 'file',
    }),
  ],
  providers: [QueueService, FileProcessor],
  exports: [QueueService],
})
export class QueueModule {}
