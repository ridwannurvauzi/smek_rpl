import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { CommitteesModule } from './committees/committees.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { AttendanceModule } from './attendance/attendance.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, EventsModule, CommitteesModule, RegistrationsModule, AttendanceModule, CertificatesModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
