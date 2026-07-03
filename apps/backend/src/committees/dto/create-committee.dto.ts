import { CommitteePosition } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommitteeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsEnum(CommitteePosition)
  position?: CommitteePosition;

  @IsOptional()
  @IsBoolean()
  canManageEvent?: boolean;

  @IsOptional()
  @IsBoolean()
  canValidateRegistration?: boolean;

  @IsOptional()
  @IsBoolean()
  canTakeAttendance?: boolean;

  @IsOptional()
  @IsBoolean()
  canGenerateCertificate?: boolean;
}
