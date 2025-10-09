import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { FileProcessor } from './file.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
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
