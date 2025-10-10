import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FileModule } from './file/file.module';
import { HealthController } from './health.controller';
import { JobModule } from './job/job.module';
import { LookupModule } from './lookup/lookup.module';
import { PermissionModule } from './permission/permission.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { QuotaModule } from './quota/quota.module';
import { ReportModule } from './report/report.module';
import { RoleModule } from './role/role.module';
import { SettingsModule } from './settings/settings.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    FileModule,
    QueueModule,
    SettingsModule,
    QuotaModule,
    ReportModule,
    LookupModule,
    JobModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global guards sẽ được thêm sau khi tạo JwtAuthGuard, RolesGuard
  ],
})
export class AppModule {}
