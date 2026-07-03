import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, Role, EventStatus } from '@prisma/client';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async register(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: { where: { status: { in: [RegistrationStatus.PENDING, RegistrationStatus.APPROVED] } } } } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== EventStatus.PUBLISHED && event.status !== EventStatus.ONGOING) {
      throw new BadRequestException('Event is not available for registration');
    }
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      throw new BadRequestException('Registration deadline has passed');
    }
    if (event._count.registrations >= event.quota) {
      throw new BadRequestException('Event quota is full');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { eventId_participantId: { eventId, participantId: userId } },
    });
    if (existing) throw new BadRequestException('Already registered for this event');

    return this.prisma.registration.create({
      data: {
        eventId,
        participantId: userId,
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
    return this.prisma.registration.findMany({
      where: { eventId },
      include: { participant: { select: { id: true, name: true, email: true, nim: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userRole: Role, userId: string) {
    if (userRole === Role.PESERTA) {
      return this.prisma.registration.findMany({
        where: { participantId: userId },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.registration.findMany({
      include: { event: true, participant: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async changeStatus(id: string, status: RegistrationStatus, validatorId?: string, rejectionReason?: string) {
    const reg = await this.prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registration not found');

    if (validatorId) {
      const user = await this.prisma.user.findUnique({ where: { id: validatorId } });
      if (user?.role === Role.PANITIA) {
        const committee = await this.prisma.eventCommittee.findUnique({
          where: { eventId_userId: { eventId: reg.eventId, userId: validatorId } },
        });
        if (!committee || !committee.canValidateRegistration) {
          throw new ForbiddenException('Not authorized to validate registrations for this event');
        }
      }
    }

    return this.prisma.registration.update({
      where: { id },
      data: {
        status,
        validatedById: status === RegistrationStatus.APPROVED || status === RegistrationStatus.REJECTED ? validatorId : reg.validatedById,
        validatedAt: status === RegistrationStatus.APPROVED || status === RegistrationStatus.REJECTED ? new Date() : reg.validatedAt,
        rejectionReason: status === RegistrationStatus.REJECTED ? rejectionReason : reg.rejectionReason,
      },
    });
  }
}
