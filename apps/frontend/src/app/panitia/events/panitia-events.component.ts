import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/toast.service';

interface Event {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  status: string;
}

interface Registration {
  id: string;
  status: string;
  participant: {
    name: string;
    email: string;
  };
  attendance?: {
    status: string;
  };
  certificate?: any;
}

@Component({
  selector: 'app-panitia-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <h2>Event yang Saya Kelola</h2>
    </div>

    <!-- Managed Events List -->
    <div *ngIf="!selectedEvent()" class="card">
      <table class="table">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid var(--border-color);">
            <th style="padding: 0.75rem;">Nama Event</th>
            <th style="padding: 0.75rem;">Lokasi</th>
            <th style="padding: 0.75rem;">Tanggal</th>
            <th style="padding: 0.75rem;">Status</th>
            <th style="padding: 0.75rem; text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of events()" style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.75rem;"><strong>{{ event.title }}</strong></td>
            <td style="padding: 0.75rem;">{{ event.location }}</td>
            <td style="padding: 0.75rem; font-size: 0.85rem;">{{ event.startAt | date:'shortDate' }} - {{ event.endAt | date:'shortDate' }}</td>
            <td style="padding: 0.75rem;"><span class="badge" [ngClass]="event.status">{{ event.status }}</span></td>
            <td style="padding: 0.75rem; text-align: right;">
              <button class="btn btn-accent btn-sm" (click)="selectEvent(event)">Kelola Event</button>
            </td>
          </tr>
          <tr *ngIf="events().length === 0">
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">Anda belum ditugaskan ke event mana pun.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Event Management Panel -->
    <div *ngIf="selectedEvent()" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
        <div>
          <button class="btn btn-secondary btn-sm" (click)="backToEvents()" style="margin-bottom: 0.5rem;">&larr; Kembali</button>
          <h3>{{ selectedEvent()?.title }}</h3>
          <p style="margin: 0; font-size: 0.875rem; color: var(--text-light)">{{ selectedEvent()?.location }} | {{ selectedEvent()?.startAt | date:'medium' }}</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-accent" (click)="generateAllCertificates()" style="background-color: var(--success-color)">Terbitkan Semua Sertifikat</button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs" style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <button class="tab-btn" [class.active]="activeTab() === 'pendaftaran'" (click)="activeTab.set('pendaftaran')">Validasi Pendaftaran</button>
        <button class="tab-btn" [class.active]="activeTab() === 'presensi'" (click)="activeTab.set('presensi')">Presensi & Kehadiran</button>
      </div>

      <!-- Tab: Pendaftaran -->
      <div *ngIf="activeTab() === 'pendaftaran'">
        <table class="table">
          <thead>
            <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
              <th style="padding: 0.5rem;">Peserta</th>
              <th style="padding: 0.5rem;">Email</th>
              <th style="padding: 0.5rem;">Status Pendaftaran</th>
              <th style="padding: 0.5rem; text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reg of registrations()" style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem;">{{ reg.participant?.name }}</td>
              <td style="padding: 0.5rem;">{{ reg.participant?.email }}</td>
              <td style="padding: 0.5rem;">
                <span class="badge" [ngClass]="reg.status">{{ reg.status }}</span>
              </td>
              <td style="padding: 0.5rem; text-align: right; min-height: 40px; display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
                <ng-container *ngIf="reg.status === 'PENDING'">
                  <button class="btn btn-accent btn-sm" (click)="approveRegistration(reg.id)" style="background-color: var(--success-color)">Setujui</button>
                  <button class="btn btn-danger btn-sm" (click)="openRejectModal(reg.id)">Tolak</button>
                </ng-container>
                <span *ngIf="reg.status !== 'PENDING'" style="color: var(--text-light); font-size: 0.875rem;">Selesai</span>
              </td>
            </tr>
            <tr *ngIf="registrations().length === 0">
              <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-light);">Belum ada pendaftaran masuk.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab: Presensi -->
      <div *ngIf="activeTab() === 'presensi'">
        <!-- Quick Attendance Recorder -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: flex-end;">
          <div style="flex: 1;">
            <label style="display: block; font-weight: bold; margin-bottom: 0.25rem;">Catat Kehadiran Cepat (Input ID Pendaftaran)</label>
            <input type="text" [(ngModel)]="attendanceRegId" placeholder="Masukkan ID Pendaftaran peserta (cth: CL-xxxx)" style="margin-bottom: 0;">
          </div>
          <button class="btn btn-accent" (click)="markAttendanceById()" style="height: 38px;">Catat Hadir</button>
        </div>

        <table class="table">
          <thead>
            <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
              <th style="padding: 0.5rem;">ID Pendaftaran</th>
              <th style="padding: 0.5rem;">Nama Peserta</th>
              <th style="padding: 0.5rem;">Status Pendaftaran</th>
              <th style="padding: 0.5rem;">Status Kehadiran</th>
              <th style="padding: 0.5rem; text-align: right;">Aksi Presensi & Sertifikat</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reg of approvedRegistrations" style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; font-family: monospace;">{{ reg.id }}</td>
              <td style="padding: 0.5rem;">{{ reg.participant?.name }}</td>
              <td style="padding: 0.5rem;"><span class="badge APPROVED">APPROVED</span></td>
              <td style="padding: 0.5rem;">
                <span class="badge" [ngClass]="reg.attendance?.status || 'ABSENT'">
                  {{ reg.attendance ? reg.attendance.status : 'ABSENT' }}
                </span>
              </td>
              <td style="padding: 0.5rem; text-align: right; display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
                <!-- Mark present button -->
                <button *ngIf="!reg.attendance" class="btn btn-accent btn-sm" (click)="markAttendance(reg.id)">Hadir</button>
                
                <!-- Certificate generate button -->
                <button *ngIf="reg.attendance?.status === 'PRESENT' && !reg.certificate" class="btn btn-primary btn-sm" (click)="generateCertificate(reg.id)">Terbitkan Sertifikat</button>
                <span *ngIf="reg.certificate" class="badge" style="background-color: #dbeafe; color: #1e40af;">Sertifikat Terbit</span>
              </td>
            </tr>
            <tr *ngIf="approvedRegistrations.length === 0">
              <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">Belum ada peserta yang disetujui (APPROVED) untuk event ini.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject Reason Modal -->
    <div class="modal-backdrop" *ngIf="isRejectModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 450px; margin: 15vh auto; position: relative;">
        <h3>Alasan Penolakan Pendaftaran</h3>
        <button (click)="closeRejectModal()" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <form [formGroup]="rejectForm" (ngSubmit)="submitReject()" style="margin-top: 1rem;">
          <div class="form-group">
            <label>Tulis alasan pendaftaran ditolak</label>
            <textarea formControlName="reason" rows="3" placeholder="Contoh: Kuota tidak mencukupi / Identitas tidak lengkap"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" (click)="closeRejectModal()">Batal</button>
            <button type="submit" class="btn btn-danger" [disabled]="rejectForm.invalid">Tolak Pendaftaran</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .badge.DRAFT, .badge.PENDING, .badge.ABSENT { background: #f3f4f6; color: #374151; }
    .badge.PUBLISHED, .badge.APPROVED, .badge.PRESENT { background: #dcfce7; color: #15803d; }
    .badge.COMPLETED, .badge.REJECTED { background: #fee2e2; color: #b91c1c; }
    
    .tab-btn {
      background: transparent;
      border: none;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      color: var(--text-light);
    }
    .tab-btn.active {
      border-bottom-color: var(--accent-color);
      color: var(--accent-color);
      font-weight: bold;
    }
  `]
})
export class PanitiaEventsComponent implements OnInit {
  events = signal<Event[]>([]);
  selectedEvent = signal<Event | null>(null);
  registrations = signal<Registration[]>([]);
  activeTab = signal('pendaftaran');
  attendanceRegId = ''; // Two-way binding for manual ID input

  // Reject Modal
  isRejectModalOpen = signal(false);
  rejectingRegId = signal<string | null>(null);
  rejectForm: FormGroup;

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  constructor() {
    this.rejectForm = this.fb.group({
      reason: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.http.get<{ success: boolean; data: Event[] }>(`${environment.apiUrl}/events`).subscribe({
      next: (res) => {
        if (res.success) this.events.set(res.data);
      }
    });
  }

  selectEvent(event: Event) {
    this.selectedEvent.set(event);
    this.loadRegistrations(event.id);
  }

  backToEvents() {
    this.selectedEvent.set(null);
  }

  loadRegistrations(eventId: string) {
    this.http.get<{ success: boolean; data: Registration[] }>(`${environment.apiUrl}/events/${eventId}/registrations`).subscribe({
      next: (res) => {
        if (res.success) this.registrations.set(res.data);
      }
    });
  }

  // Filtered registrations computed helper
  get approvedRegistrations(): Registration[] {
    return this.registrations().filter(r => r.status === 'APPROVED');
  }

  approveRegistration(regId: string) {
    this.http.patch<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/approve`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Pendaftaran peserta berhasil disetujui.');
          const event = this.selectedEvent();
          if (event) this.loadRegistrations(event.id);
        }
      }
    });
  }

  openRejectModal(regId: string) {
    this.rejectingRegId.set(regId);
    this.rejectForm.reset();
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal() {
    this.isRejectModalOpen.set(false);
  }

  submitReject() {
    const regId = this.rejectingRegId();
    if (regId && this.rejectForm.valid) {
      this.http.patch<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/reject`, this.rejectForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Pendaftaran peserta berhasil ditolak.');
            const event = this.selectedEvent();
            if (event) this.loadRegistrations(event.id);
            this.closeRejectModal();
          }
        }
      });
    }
  }

  // Attendance & Certificates Actions
  markAttendance(regId: string) {
    this.http.post<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/attendance`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Kehadiran berhasil dicatat!');
          const event = this.selectedEvent();
          if (event) this.loadRegistrations(event.id);
        }
      }
    });
  }

  markAttendanceById() {
    const regId = this.attendanceRegId.trim();
    if (!regId) return;

    this.http.post<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/attendance`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Kehadiran berhasil dicatat!');
          this.attendanceRegId = '';
          const event = this.selectedEvent();
          if (event) this.loadRegistrations(event.id);
        }
      },
      error: (err) => {
        this.toastService.danger(err.error?.message || 'Gagal mencatat kehadiran. Pastikan ID terdaftar dan berstatus APPROVED.');
      }
    });
  }

  generateCertificate(regId: string) {
    this.http.post<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/certificate`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Sertifikat berhasil diterbitkan!');
          const event = this.selectedEvent();
          if (event) this.loadRegistrations(event.id);
        }
      }
    });
  }

  generateAllCertificates() {
    const event = this.selectedEvent();
    if (event) {
      this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/events/${event.id}/certificates/generate`, {}).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'Sertifikat berhasil diterbitkan untuk semua peserta yang hadir!');
          this.loadRegistrations(event.id);
        },
        error: (err) => {
          this.toastService.danger(err.error?.message || 'Gagal menerbitkan sertifikat');
        }
      });
    }
  }
}
