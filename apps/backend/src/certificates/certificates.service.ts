import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AttendanceStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async generate(registrationId: string, issuerId: string, userRole: Role) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, attendance: true, certificate: true },
    });

    if (!registration) throw new NotFoundException('Registration not found');
    if (!registration.attendance || registration.attendance.status !== AttendanceStatus.PRESENT) {
      throw new BadRequestException('Participant must be present to get a certificate');
    }
    if (registration.certificate) {
      return registration.certificate; // Already generated
    }

    if (userRole === Role.PANITIA) {
      const committee = await this.prisma.eventCommittee.findUnique({
        where: { eventId_userId: { eventId: registration.eventId, userId: issuerId } },
      });
      if (!committee || !committee.canGenerateCertificate) {
        throw new ForbiddenException('Not authorized to generate certificates for this event');
      }
    }

    const verificationCode = uuidv4().split('-')[0].toUpperCase() + '-' + Date.now().toString().slice(-4);
    const certificateNumber = `SMEK-${new Date().getFullYear()}-${verificationCode}`;

    return this.prisma.certificate.create({
      data: {
        registrationId,
        issuedById: issuerId,
        certificateNumber,
        verificationCode,
        certificateUrl: `/assets/certificates/${certificateNumber}.pdf`, // Dummy URL for now
      },
    });
  }

  async generateAllForEvent(eventId: string, issuerId: string, userRole: Role) {
    if (userRole === Role.PANITIA) {
      const committee = await this.prisma.eventCommittee.findUnique({
        where: { eventId_userId: { eventId, userId: issuerId } },
      });
      if (!committee || !committee.canGenerateCertificate) {
        throw new ForbiddenException('Not authorized to generate certificates for this event');
      }
    }

    const presentRegistrations = await this.prisma.registration.findMany({
      where: { eventId, attendance: { status: AttendanceStatus.PRESENT }, certificate: null },
    });

    const generated = [];
    for (const reg of presentRegistrations) {
      generated.push(await this.generate(reg.id, issuerId, userRole));
    }
    return generated;
  }

  async findAll() {
    return this.prisma.certificate.findMany({
      include: {
        registration: { include: { participant: { select: { name: true, email: true } }, event: { select: { title: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findAllMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { registration: { participantId: userId } },
      include: { registration: { include: { event: { select: { title: true, startAt: true, endAt: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findByRegistration(registrationId: string) {
    return this.prisma.certificate.findUnique({ where: { registrationId } });
  }

  async verify(verificationCode: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { verificationCode },
      include: { registration: { include: { participant: { select: { name: true } }, event: { select: { title: true } } } } },
    });
    if (!cert) throw new NotFoundException('Certificate not valid');
    return cert;
  }
}
