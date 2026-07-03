import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role, EventStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: User) {
    const data = await this.eventsService.create(createEventDto, user.id);
    return { success: true, message: 'Event created', data };
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    const data = await this.eventsService.findAll(user.role, user.id);
    return { success: true, message: 'Events retrieved', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.eventsService.findOne(id);
    return { success: true, message: 'Event retrieved', data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PANITIA)
  async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    const data = await this.eventsService.update(id, updateEventDto);
    return { success: true, message: 'Event updated', data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    const data = await this.eventsService.remove(id);
    return { success: true, message: 'Event deleted', data };
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.PANITIA)
  async updateStatus(@Param('id') id: string, @Body('status') status: EventStatus) {
    const data = await this.eventsService.updateStatus(id, status);
    return { success: true, message: 'Event status updated', data };
  }
}
