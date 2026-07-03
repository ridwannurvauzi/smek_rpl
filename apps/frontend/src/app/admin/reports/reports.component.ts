import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AdminSummary {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalCertificates: number;
}

interface Event {
  id: string;
  title: string;
  startDate: string; // Keep interface naming or match, let's match schema
  startAt: string;
  endAt: string;
  status: string;
}

interface EventReport {
  event: Event;
  stats: {
    totalRegistrations: number;
    totalApproved: number;
    totalRejected: number;
    totalPresent: number;
    totalCertificates: number;
  };
  registrations: any[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <h2>Laporan Event Kampus (Admin)</h2>
    </div>

    <!-- Summary Widgets -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="stat-card">
        <h3>{{ summary()?.totalUsers || 0 }}</h3>
        <p>Total Pengguna</p>
      </div>
      <div class="stat-card">
        <h3>{{ summary()?.totalEvents || 0 }}</h3>
        <p>Total Event</p>
      </div>
      <div class="stat-card">
        <h3>{{ summary()?.totalRegistrations || 0 }}</h3>
        <p>Total Pendaftaran</p>
      </div>
      <div class="stat-card">
        <h3>{{ summary()?.totalCertificates || 0 }}</h3>
        <p>Sertifikat Terbit</p>
      </div>
    </div>

    <!-- Event Lists for Reports -->
    <div class="card">
      <h3 style="margin-bottom: 1rem;">Rekapitulasi per Event</h3>
      <table class="table">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
            <th style="padding: 0.75rem;">Nama Event</th>
            <th style="padding: 0.75rem;">Tanggal</th>
            <th style="padding: 0.75rem;">Status</th>
            <th style="padding: 0.75rem; text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of events()" style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.75rem;"><strong>{{ event.title }}</strong></td>
            <td style="padding: 0.75rem; font-size: 0.85rem;">{{ event.startAt | date:'shortDate' }} - {{ event.endAt | date:'shortDate' }}</td>
            <td style="padding: 0.75rem;"><span class="badge" [ngClass]="event.status">{{ event.status }}</span></td>
            <td style="padding: 0.75rem; text-align: right;">
              <button class="btn btn-accent btn-sm" (click)="viewReport(event.id)">Lihat Detail</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Report Detail Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 850px; margin: 5vh auto; position: relative;">
        <h3>Detail Laporan: {{ reportData()?.event?.title }}</h3>
        <button (click)="closeModal()" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <!-- Stats Row -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-top: 1.5rem; margin-bottom: 1.5rem;">
          <div class="mini-stat-card">
            <h4>{{ reportData()?.stats?.totalRegistrations }}</h4>
            <p>Pendaftar</p>
          </div>
          <div class="mini-stat-card">
            <h4>{{ reportData()?.stats?.totalApproved }}</h4>
            <p>Disetujui</p>
          </div>
          <div class="mini-stat-card">
            <h4>{{ reportData()?.stats?.totalRejected }}</h4>
            <p>Ditolak</p>
          </div>
          <div class="mini-stat-card">
            <h4>{{ reportData()?.stats?.totalPresent }}</h4>
            <p>Hadir (Presensi)</p>
          </div>
          <div class="mini-stat-card">
            <h4>{{ reportData()?.stats?.totalCertificates }}</h4>
            <p>Sertifikat</p>
          </div>
        </div>

        <!-- Participants Table -->
        <h4>Daftar Peserta & Status</h4>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; margin-top: 0.75rem;">
          <table class="table" style="margin-bottom: 0;">
            <thead>
              <tr style="text-align: left; background: #f8fafc; border-bottom: 1px solid var(--border-color);">
                <th style="padding: 0.5rem;">Nama</th>
                <th style="padding: 0.5rem;">Email</th>
                <th style="padding: 0.5rem;">Pendaftaran</th>
                <th style="padding: 0.5rem;">Presensi</th>
                <th style="padding: 0.5rem;">Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let reg of reportData()?.registrations" style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.5rem;">{{ reg.participant?.name }}</td>
                <td style="padding: 0.5rem;">{{ reg.participant?.email }}</td>
                <td style="padding: 0.5rem;">
                  <span class="badge" [ngClass]="reg.status">{{ reg.status }}</span>
                </td>
                <td style="padding: 0.5rem;">
                  <span *ngIf="reg.attendance" class="badge" [ngClass]="reg.attendance?.status">{{ reg.attendance?.status }}</span>
                  <span *ngIf="!reg.attendance" style="color: var(--text-light)">-</span>
                </td>
                <td style="padding: 0.5rem; font-size: 0.8rem;">
                  {{ reg.certificate ? 'Terbit (' + (reg.certificate.verificationCode | slice:0:8) + ')' : '-' }}
                </td>
              </tr>
              <tr *ngIf="reportData()?.registrations?.length === 0">
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">Belum ada pendaftaran.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-card h3 { font-size: 2rem; margin-bottom: 0.25rem; color: var(--accent-color); }
    .stat-card p { margin: 0; color: var(--text-light); font-size: 0.875rem; }
    
    .mini-stat-card {
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 4px;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .mini-stat-card h4 { margin: 0 0 0.15rem 0; font-size: 1.25rem; color: var(--primary-color); }
    .mini-stat-card p { margin: 0; color: var(--text-light); font-size: 0.75rem; }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
    }
    .badge.DRAFT, .badge.PENDING { background: #f3f4f6; color: #374151; }
    .badge.PUBLISHED, .badge.APPROVED, .badge.PRESENT { background: #dcfce7; color: #15803d; }
    .badge.COMPLETED, .badge.REJECTED, .badge.ABSENT { background: #fee2e2; color: #b91c1c; }
  `]
})
export class ReportsComponent implements OnInit {
  summary = signal<AdminSummary | null>(null);
  events = signal<Event[]>([]);
  isModalOpen = signal(false);
  reportData = signal<EventReport | null>(null);

  private http = inject(HttpClient);

  ngOnInit() {
    this.loadSummary();
    this.loadEvents();
  }

  loadSummary() {
    this.http.get<{ success: boolean; data: AdminSummary }>(`${environment.apiUrl}/reports/admin/summary`).subscribe({
      next: (res) => {
        if (res.success) this.summary.set(res.data);
      }
    });
  }

  loadEvents() {
    this.http.get<{ success: boolean; data: Event[] }>(`${environment.apiUrl}/events`).subscribe({
      next: (res) => {
        if (res.success) this.events.set(res.data);
      }
    });
  }

  viewReport(eventId: string) {
    this.http.get<{ success: boolean; data: EventReport }>(`${environment.apiUrl}/reports/events/${eventId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.reportData.set(res.data);
          this.isModalOpen.set(true);
        }
      }
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
}
