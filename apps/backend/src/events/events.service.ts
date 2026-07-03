import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus, Role } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, userId: string) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        startAt: new Date(createEventDto.startAt),
        endAt: new Date(createEventDto.endAt),
        registrationDeadline: createEventDto.registrationDeadline ? new Date(createEventDto.registrationDeadline) : null,
        createdById: userId,
      },
    });
  }

  async findAll(userRole: Role, userId: string) {
    if (userRole === Role.ADMIN) {
      return this.prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (userRole === Role.PANITIA) {
      return this.prisma.event.findMany({
        where: { committees: { some: { userId } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return this.prisma.event.findMany({
        where: { status: { in: [EventStatus.PUBLISHED, EventStatus.ONGOING] } },
        orderBy: { startAt: 'asc' },
      });
    }
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        committees: { include: { user: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const data: any = { ...updateEventDto };
    if (data.startAt) data.startAt = new Date(data.startAt);
    if (data.endAt) data.endAt = new Date(data.endAt);
    if (data.registrationDeadline) data.registrationDeadline = new Date(data.registrationDeadline);

    return this.prisma.event.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  async updateStatus(id: string, status: EventStatus) {
    return this.prisma.event.update({
      where: { id },
      data: { status },
    });
  }
}
