import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AttendanceStatus, RegistrationStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(registrationId: string, checkerId: string, userRole: Role) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, attendance: true },
    });

    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.status !== RegistrationStatus.APPROVED) {
      throw new BadRequestException('Participant must be approved first');
    }
    if (registration.attendance) {
      throw new BadRequestException('Attendance already recorded');
    }

    if (userRole === Role.PANITIA) {
      const committee = await this.prisma.eventCommittee.findUnique({
        where: { eventId_userId: { eventId: registration.eventId, userId: checkerId } },
      });
      if (!committee || !committee.canTakeAttendance) {
        throw new ForbiddenException('Not authorized to take attendance for this event');
      }
    }

    return this.prisma.attendance.create({
      data: {
        registrationId,
        checkedInById: checkerId,
        status: AttendanceStatus.PRESENT,
      },
    });
  }

  async findAllByEvent(eventId: string, userRole: Role, userId: string) {
    if (userRole === Role.PANITIA) {
      const committee = await this.prisma.eventCommittee.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (!committee) throw new ForbiddenException('Not assigned to this event');
    }

    return this.prisma.attendance.findMany({
      where: { registration: { eventId } },
      include: {
        registration: { include: { participant: { select: { name: true, email: true, nim: true } } } },
        checkedInBy: { select: { name: true } },
      },
      orderBy: { checkedInAt: 'desc' },
    });
  }
}
