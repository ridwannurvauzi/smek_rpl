import { Controller, Get, Post, Param, ForbiddenException, Res } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller()
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('registrations/:registrationId/certificate')
  @Roles(Role.ADMIN, Role.PANITIA)
  async generate(@Param('registrationId') registrationId: string, @CurrentUser() user: User) {
    const data = await this.certificatesService.generate(registrationId, user.id, user.role);
    return { success: true, message: 'Certificate generated', data };
  }

  @Post('events/:eventId/certificates/generate')
  @Roles(Role.ADMIN, Role.PANITIA)
  async generateAll(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    const data = await this.certificatesService.generateAllForEvent(eventId, user.id, user.role);
    return { success: true, message: `Generated ${data.length} certificates`, data };
  }

  @Get('certificates')
  @Roles(Role.ADMIN)
  async findAll() {
    const data = await this.certificatesService.findAll();
    return { success: true, message: 'Certificates retrieved', data };
  }

  @Get('my/certificates')
  @Roles(Role.PESERTA)
  async findMyCertificates(@CurrentUser() user: User) {
    const data = await this.certificatesService.findAllMyCertificates(user.id);
    return { success: true, message: 'My certificates retrieved', data };
  }

  @Get('certificates/verify/:verificationCode')
  @Public()
  async verify(@Param('verificationCode') verificationCode: string) {
    const data = await this.certificatesService.verify(verificationCode);
    return { success: true, message: 'Certificate is valid', data };
  }
}
