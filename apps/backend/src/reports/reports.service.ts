import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, RegistrationStatus, AttendanceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAdminSummary() {
    const totalUsers = await this.prisma.user.count();
    const totalEvents = await this.prisma.event.count();
    const totalRegistrations = await this.prisma.registration.count();
    const totalCertificates = await this.prisma.certificate.count();

    return { totalUsers, totalEvents, totalRegistrations, totalCertificates };
  }

  async getPanitiaSummary(userId: string) {
    const committees = await this.prisma.eventCommittee.findMany({ where: { userId } });
    const eventIds = committees.map((c) => c.eventId);

    const totalEvents = eventIds.length;
    const totalParticipants = await this.prisma.registration.count({ where: { eventId: { in: eventIds } } });
    const totalValidated = await this.prisma.registration.count({ where: { eventId: { in: eventIds }, status: RegistrationStatus.APPROVED } });
    const totalPresent = await this.prisma.attendance.count({ where: { registration: { eventId: { in: eventIds } }, status: AttendanceStatus.PRESENT } });
    const totalCertificates = await this.prisma.certificate.count({ where: { registration: { eventId: { in: eventIds } } } });

    return { totalEvents, totalParticipants, totalValidated, totalPresent, totalCertificates };
  }

  async getEventReport(eventId: string, userRole: Role, userId: string) {
    if (userRole === Role.PANITIA) {
      const committee = await this.prisma.eventCommittee.findUnique({ where: { eventId_userId: { eventId, userId } } });
      if (!committee) throw new ForbiddenException('Not assigned to this event');
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const registrations = await this.prisma.registration.findMany({ where: { eventId }, include: { attendance: true, certificate: true } });

    const totalRegistrations = registrations.length;
    const totalApproved = registrations.filter((r) => r.status === RegistrationStatus.APPROVED).length;
    const totalRejected = registrations.filter((r) => r.status === RegistrationStatus.REJECTED).length;
    const totalPresent = registrations.filter((r) => r.attendance?.status === AttendanceStatus.PRESENT).length;
    const totalCertificates = registrations.filter((r) => r.certificate).length;

    return {
      event,
      stats: { totalRegistrations, totalApproved, totalRejected, totalPresent, totalCertificates },
      registrations,
    };
  }
}
