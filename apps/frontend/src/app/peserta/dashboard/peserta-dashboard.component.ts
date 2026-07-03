import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-peserta-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h2 class="mb-4">Dashboard Peserta</h2>
    <div class="grid-cards">
      <div class="stat-card">
        <h3>{{ registrations().length }}</h3>
        <p>Event Diikuti</p>
      </div>
      <div class="stat-card">
        <h3>{{ pendingCount() }}</h3>
        <p>Pendaftaran Pending</p>
      </div>
      <div class="stat-card">
        <h3>{{ certificates().length }}</h3>
        <p>Sertifikat Tersedia</p>
      </div>
    </div>
    
    <div class="card mt-4">
      <h3>Riwayat Pendaftaran</h3>
      <table *ngIf="registrations().length > 0; else noData" class="table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Event</th>
            <th>Tanggal Daftar</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let reg of registrations(); let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ reg.event?.title }}</td>
            <td>{{ reg.createdAt | date:'mediumDate' }}</td>
            <td>
              <span class="badge" [ngClass]="reg.status">
                {{ reg.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #noData>
        <p class="text-light">Belum ada riwayat pendaftaran</p>
      </ng-template>
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
export class PesertaDashboardComponent implements OnInit {
  registrations = signal<any[]>([]);
  certificates = signal<any[]>([]);
  
  pendingCount = computed(() => 
    this.registrations().filter((r: any) => r.status === 'PENDING').length
  );
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/registrations`).subscribe((res) => {
      if (res.success) {
        this.registrations.set(res.data.slice(0, 5));
      }
    });
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/my/certificates`).subscribe((res) => {
      if (res.success) this.certificates.set(res.data);
    });
  }
}
