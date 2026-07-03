import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CommitteesService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, createCommitteeDto: CreateCommitteeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: createCommitteeDto.userId } });
    if (!user || user.role !== Role.PANITIA) {
      throw new BadRequestException('User must be a PANITIA');
    }
    return this.prisma.eventCommittee.create({
      data: {
        eventId,
        ...createCommitteeDto,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.eventCommittee.findMany({
      where: { eventId },
      include: { user: true },
    });
  }

  async remove(eventId: string, committeeId: string) {
    return this.prisma.eventCommittee.delete({
      where: { id: committeeId },
    });
  }
}
