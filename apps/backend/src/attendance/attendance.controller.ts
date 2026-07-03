import { Controller, Get, Post, Param, ForbiddenException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('registrations/:registrationId/attendance')
  @Roles(Role.ADMIN, Role.PANITIA)
  async markAttendance(@Param('registrationId') registrationId: string, @CurrentUser() user: User) {
    const data = await this.attendanceService.markAttendance(registrationId, user.id, user.role);
    return { success: true, message: 'Attendance marked', data };
  }

  @Get('events/:eventId/attendance')
  @Roles(Role.ADMIN, Role.PANITIA)
  async findAllByEvent(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const data = await this.attendanceService.findAllByEvent(eventId, user.role, user.id);
    return { success: true, message: 'Attendance retrieved', data };
  }
}
