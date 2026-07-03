import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/toast.service';

interface Event {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  quota: number;
  status: string;
  bannerUrl?: string;
}

interface Registration {
  id: string;
  eventId: string;
  status: string;
}

@Component({
  selector: 'app-peserta-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <h2>Daftar Event Kampus</h2>
      <p style="margin: 0; color: var(--text-light)">Temukan dan ikuti berbagai event menarik di kampus!</p>
    </div>

    <!-- Active Events Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
      <div *ngFor="let event of publishedEvents" class="card" style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; border-top: 4px solid var(--accent-color); padding: 0;">
        <!-- Banner/Thumbnail -->
        <div style="width: 100%; height: 160px; background: #e2e8f0; position: relative; display: flex; align-items: center; justify-content: center;">
          <img *ngIf="event.bannerUrl" [src]="event.bannerUrl" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
          <div *ngIf="!event.bannerUrl" style="color: var(--text-light); font-size: 1.5rem;">📅</div>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem; color: var(--primary-color);">{{ event.title }}</h3>
          <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1rem; line-height: 1.4;">{{ event.description }}</p>
          
          <div style="margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem; color: var(--text-main); border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <div>📅 <strong>Tanggal:</strong> {{ event.startAt | date:'medium' }}</div>
            <div>📍 <strong>Lokasi:</strong> {{ event.location }}</div>
            <div>👥 <strong>Kuota:</strong> {{ event.quota }} peserta</div>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--border-color);">
          <button *ngIf="!isRegistered(event.id)" class="btn btn-accent w-100" (click)="openConfirmModal(event.id)">Daftar Sekarang</button>
          
          <div *ngIf="isRegistered(event.id)" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--success-color); font-weight: bold; font-size: 0.875rem; padding: 0.5rem 0;">
            ✔ Sudah Terdaftar
            <span class="badge" [ngClass]="getRegistrationStatus(event.id)">{{ getRegistrationStatus(event.id) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="publishedEvents.length === 0" class="card" style="text-align: center; padding: 4rem; color: var(--text-light);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
      <h3>Tidak Ada Event Aktif</h3>
      <p>Saat ini belum ada event baru yang dipublikasikan. Silakan cek kembali nanti!</p>
    </div>

    <!-- Reusable Premium Custom Confirmation Popup Modal -->
    <div class="modal-backdrop" *ngIf="isConfirmModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 400px; margin: 20vh auto; text-align: center; position: relative;">
        <h3 style="margin-bottom: 0.5rem;">Konfirmasi Pendaftaran</h3>
        <p style="margin: 0.5rem 0 1.5rem 0; color: var(--text-light); font-size: 0.9rem; line-height: 1.4;">
          Apakah Anda yakin ingin mendaftar ke event ini? Pendaftaran Anda akan diverifikasi oleh panitia acara.
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <button class="btn btn-secondary" (click)="closeConfirmModal()">Batal</button>
          <button class="btn btn-accent" (click)="confirmRegistration()">Daftar</button>
        </div>
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
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
    }
    .badge.PENDING { background: #fef3c7; color: #92400e; }
    .badge.APPROVED { background: #dcfce7; color: #15803d; }
    .badge.REJECTED { background: #fee2e2; color: #b91c1c; }
    .badge.CANCELLED { background: #f3f4f6; color: #374151; }
  `]
})
export class PesertaEventsComponent implements OnInit {
  events = signal<Event[]>([]);
  myRegistrations = signal<Registration[]>([]);

  // Custom Modal States
  isConfirmModalOpen = signal(false);
  pendingEventId = signal<string | null>(null);

  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.loadEvents();
    this.loadMyRegistrations();
  }

  loadEvents() {
    this.http.get<{ success: boolean; data: Event[] }>(`${environment.apiUrl}/events`).subscribe({
      next: (res) => {
        if (res.success) this.events.set(res.data);
      }
    });
  }

  loadMyRegistrations() {
    this.http.get<{ success: boolean; data: Registration[] }>(`${environment.apiUrl}/registrations`).subscribe({
      next: (res) => {
        if (res.success) this.myRegistrations.set(res.data);
      }
    });
  }

  // Filter for published events
  get publishedEvents(): Event[] {
    return this.events().filter(e => e.status === 'PUBLISHED');
  }

  isRegistered(eventId: string): boolean {
    return this.myRegistrations().some(r => r.eventId === eventId && r.status !== 'CANCELLED');
  }

  getRegistrationStatus(eventId: string): string {
    const reg = this.myRegistrations().find(r => r.eventId === eventId && r.status !== 'CANCELLED');
    return reg ? reg.status : '';
  }

  openConfirmModal(eventId: string) {
    this.pendingEventId.set(eventId);
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.isConfirmModalOpen.set(false);
    this.pendingEventId.set(null);
  }

  confirmRegistration() {
    const eventId = this.pendingEventId();
    if (eventId) {
      this.http.post<{ success: boolean }>(`${environment.apiUrl}/events/${eventId}/register`, {}).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.success('Pendaftaran berhasil diajukan! Menunggu persetujuan panitia.');
            this.loadMyRegistrations();
            this.closeConfirmModal();
          }
        },
        error: (err) => {
          this.toastService.danger(err.error?.message || 'Gagal mendaftar ke event');
          this.closeConfirmModal();
        }
      });
    }
  }
}
