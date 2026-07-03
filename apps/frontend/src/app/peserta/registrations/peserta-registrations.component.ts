import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Event {
  id: string;
  title: string;
  startDate: string;
  location: string;
}

interface Registration {
  id: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  event: Event;
}

@Component({
  selector: 'app-peserta-registrations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <h2>Pendaftaran Saya</h2>
      <p style="margin: 0; color: var(--text-light)">Pantau status pendaftaran event yang Anda ikuti.</p>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr style="text-align: left; border-bottom: 2px solid var(--border-color);">
            <th style="padding: 0.75rem;">ID Pendaftaran</th>
            <th style="padding: 0.75rem;">Nama Event</th>
            <th style="padding: 0.75rem;">Tanggal Daftar</th>
            <th style="padding: 0.75rem;">Status</th>
            <th style="padding: 0.75rem; text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let reg of registrations()" style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.75rem; font-family: monospace; font-size: 0.85rem;">{{ reg.id }}</td>
            <td style="padding: 0.75rem;">
              <strong>{{ reg.event?.title }}</strong>
              <div *ngIf="reg.rejectionReason" style="font-size: 0.75rem; color: var(--danger-color); margin-top: 0.25rem;">
                ⚠ Alasan ditolak: "{{ reg.rejectionReason }}"
              </div>
            </td>
            <td style="padding: 0.75rem; font-size: 0.85rem;">{{ reg.createdAt | date:'mediumDate' }}</td>
            <td style="padding: 0.75rem;"><span class="badge" [ngClass]="reg.status">{{ reg.status }}</span></td>
            <td style="padding: 0.75rem; text-align: right;">
              <button *ngIf="reg.status === 'PENDING'" class="btn btn-danger btn-sm" (click)="cancelRegistration(reg.id)">Batalkan</button>
              <span *ngIf="reg.status !== 'PENDING'" style="color: var(--text-light); font-size: 0.85rem;">Tidak ada aksi</span>
            </td>
          </tr>
          <tr *ngIf="registrations().length === 0">
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">Anda belum mendaftar ke event mana pun.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .badge.PENDING { background: #fef3c7; color: #92400e; }
    .badge.APPROVED { background: #dcfce7; color: #15803d; }
    .badge.REJECTED { background: #fee2e2; color: #b91c1c; }
    .badge.CANCELLED { background: #f3f4f6; color: #374151; }
  `]
})
export class PesertaRegistrationsComponent implements OnInit {
  registrations = signal<Registration[]>([]);

  private http = inject(HttpClient);

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.http.get<{ success: boolean; data: Registration[] }>(`${environment.apiUrl}/registrations`).subscribe({
      next: (res) => {
        if (res.success) this.registrations.set(res.data);
      }
    });
  }

  cancelRegistration(regId: string) {
    if (confirm('Apakah Anda yakin ingin membatalkan pendaftaran ini?')) {
      this.http.patch<{ success: boolean }>(`${environment.apiUrl}/registrations/${regId}/cancel`, {}).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Pendaftaran berhasil dibatalkan.');
            this.loadRegistrations();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Gagal membatalkan pendaftaran');
        }
      });
    }
  }
}
