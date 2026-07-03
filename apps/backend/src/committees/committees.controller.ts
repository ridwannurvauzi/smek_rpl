import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CommitteesService } from './committees.service';
import { CreateCommitteeDto } from './dto/create-committee.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('events/:eventId/committees')
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Param('eventId') eventId: string, @Body() createCommitteeDto: CreateCommitteeDto) {
    const data = await this.committeesService.create(eventId, createCommitteeDto);
    return { success: true, message: 'Committee assigned', data };
  }

  @Get()
  @Roles(Role.ADMIN, Role.PANITIA)
  async findAll(@Param('eventId') eventId: string) {
    const data = await this.committeesService.findAll(eventId);
    return { success: true, message: 'Committees retrieved', data };
  }

  @Delete(':committeeId')
  @Roles(Role.ADMIN)
  async remove(@Param('eventId') eventId: string, @Param('committeeId') committeeId: string) {
    const data = await this.committeesService.remove(eventId, committeeId);
    return { success: true, message: 'Committee removed', data };
  }
}
