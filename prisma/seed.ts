import { PrismaClient, Role, EventStatus, RegistrationStatus, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smek.test' },
    update: {},
    create: {
      email: 'admin@smek.test',
      name: 'Admin SMEK',
      passwordHash,
      role: Role.ADMIN,
      nip: '1234567890',
    },
  });

  const panitia1 = await prisma.user.upsert({
    where: { email: 'panitia@smek.test' },
    update: {},
    create: {
      email: 'panitia@smek.test',
      name: 'Panitia SMEK 1',
      passwordHash,
      role: Role.PANITIA,
      nip: '0987654321',
    },
  });

  const peserta1 = await prisma.user.upsert({
    where: { email: 'peserta@smek.test' },
    update: {},
    create: {
      email: 'peserta@smek.test',
      name: 'Peserta 1',
      passwordHash,
      role: Role.PESERTA,
      nim: '1122334455',
    },
  });

  // 2. Events
  const draftEvent = await prisma.event.create({
    data: {
      title: 'Workshop Cloud Computing (Draft)',
      description: 'Pengenalan layanan cloud untuk pemula.',
      location: 'Lab Komputer 1',
      startAt: new Date(new Date().getTime() + 86400000 * 10), // 10 days later
      endAt: new Date(new Date().getTime() + 86400000 * 10 + 7200000), // 2 hours duration
      registrationDeadline: new Date(new Date().getTime() + 86400000 * 5),
      quota: 50,
      status: EventStatus.DRAFT,
      createdById: admin.id,
    },
  });

  const publishedEvent = await prisma.event.create({
    data: {
      title: 'Seminar Nasional AI',
      description: 'Peluang dan tantangan AI di masa depan.',
      location: 'Auditorium Utama',
      startAt: new Date(new Date().getTime() + 86400000 * 5),
      endAt: new Date(new Date().getTime() + 86400000 * 5 + 14400000),
      registrationDeadline: new Date(new Date().getTime() + 86400000 * 3),
      quota: 100,
      status: EventStatus.PUBLISHED,
      createdById: admin.id,
    },
  });

  const finishedEvent = await prisma.event.create({
    data: {
      title: 'Pelatihan Web Development',
      description: 'Membuat web dengan Angular dan NestJS.',
      location: 'Ruang Seminar 2',
      startAt: new Date(new Date().getTime() - 86400000 * 5),
      endAt: new Date(new Date().getTime() - 86400000 * 5 + 7200000),
      registrationDeadline: new Date(new Date().getTime() - 86400000 * 6),
      quota: 30,
      status: EventStatus.FINISHED,
      createdById: admin.id,
    },
  });

  // 3. Committees
  await prisma.eventCommittee.create({
    data: {
      eventId: publishedEvent.id,
      userId: panitia1.id,
      position: 'KETUA',
      canManageEvent: true,
    },
  });

  await prisma.eventCommittee.create({
    data: {
      eventId: finishedEvent.id,
      userId: panitia1.id,
      position: 'ANGGOTA',
    },
  });

  // 4. Registrations
  // Peserta 1 registers for Published Event (PENDING)
  await prisma.registration.create({
    data: {
      eventId: publishedEvent.id,
      participantId: peserta1.id,
      status: RegistrationStatus.PENDING,
    },
  });

  // Peserta 1 registered for Finished Event (APPROVED)
  const regFinished = await prisma.registration.create({
    data: {
      eventId: finishedEvent.id,
      participantId: peserta1.id,
      status: RegistrationStatus.APPROVED,
      validatedById: panitia1.id,
      validatedAt: new Date(new Date().getTime() - 86400000 * 5.5),
    },
  });

  // 5. Attendance
  const attendance = await prisma.attendance.create({
    data: {
      registrationId: regFinished.id,
      checkedInById: panitia1.id,
      status: AttendanceStatus.PRESENT,
      checkedInAt: new Date(new Date().getTime() - 86400000 * 5),
    },
  });

  // 6. Certificate
  await prisma.certificate.create({
    data: {
      registrationId: regFinished.id,
      certificateNumber: 'SMEK-2026-001',
      verificationCode: 'VER-SMEK-001',
      certificateUrl: '/assets/dummy-cert.pdf',
      issuedById: panitia1.id,
    },
  });

  console.log('Seed data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
