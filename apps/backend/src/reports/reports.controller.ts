import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('admin/summary')
  @Roles(Role.ADMIN)
  async getAdminSummary() {
    const data = await this.reportsService.getAdminSummary();
    return { success: true, message: 'Admin summary retrieved', data };
  }

  @Get('panitia/summary')
  @Roles(Role.PANITIA)
  async getPanitiaSummary(@CurrentUser() user: User) {
    const data = await this.reportsService.getPanitiaSummary(user.id);
    return { success: true, message: 'Panitia summary retrieved', data };
  }

  @Get('events/:eventId')
  @Roles(Role.ADMIN, Role.PANITIA)
  async getEventReport(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const data = await this.reportsService.getEventReport(eventId, user.role, user.id);
    return { success: true, message: 'Event report retrieved', data };
  }
}
