import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { QueueModule } from '../queue/queue.module';
import { QuotaModule } from '../quota/quota.module';
import { DataImportController } from './data-import.controller';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';

@Module({
  imports: [
    QueueModule,
    QuotaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `upload-${uniqueSuffix}-${file.originalname}`);
        },
      }),
    }),
  ],
  controllers: [LookupController, DataImportController],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}