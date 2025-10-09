import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobSeederService } from './job-seeder.service';
import { JobController } from './job.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobController],
  providers: [JobService, JobSeederService],
  exports: [JobService, JobSeederService],
})
export class JobModule {}