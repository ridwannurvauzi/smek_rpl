# Sistem Manajemen Event Kampus (SMEK)

SMEK adalah aplikasi berbasis web untuk mengelola event kampus secara terintegrasi, meliputi manajemen event, pendaftaran peserta, validasi peserta, presensi kehadiran, dan manajemen e-sertifikat.

## Teknologi
- **Frontend**: Angular 18+, TypeScript, CSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT
- **Infrastruktur**: Docker Compose

## Struktur Folder
- `apps/frontend/` - Aplikasi Angular
- `apps/backend/` - API NestJS
- `prisma/` - Skema dan seed database
- `docker-compose.yml` - Konfigurasi database

## Cara Menjalankan

### 1. Prasyarat
Pastikan Anda telah menginstal:
- Node.js (v18+)
- npm
- Docker Desktop (untuk PostgreSQL)

### 2. Setup Database
Salin konfigurasi environment dan jalankan PostgreSQL melalui Docker:
```bash
cp .env.example .env
docker-compose up -d
```

### 3. Setup Backend
Masuk ke folder backend, install dependency, jalankan migrasi, dan seed:
```bash
cd apps/backend
npm install
npm install prisma @prisma/client
npm install bcrypt class-validator class-transformer @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/bcrypt @types/passport-jwt
npx prisma generate --schema=../../prisma/schema.prisma
npx prisma migrate dev --name init --schema=../../prisma/schema.prisma
npx prisma db seed
npm run start:dev
```
Backend akan berjalan di `http://localhost:3000`.

### 4. Setup Frontend
Buka terminal baru, masuk ke folder frontend, install dependency, dan jalankan:
```bash
cd apps/frontend
npm install
npm start
```
Frontend akan berjalan di `http://localhost:4200`.

## Akun Default (Seed)
Setelah menjalankan seed, Anda bisa login menggunakan akun berikut:
- **Admin**: `admin@smek.test` / `password123`
- **Panitia**: `panitia@smek.test` / `password123`
- **Peserta**: `peserta@smek.test` / `password123`
