import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <h2 class="mb-4">Dashboard Admin</h2>
    <div class="grid-cards">
      <div class="stat-card">
        <h3>{{ stats().totalUsers }}</h3>
        <p>Total User</p>
      </div>
      <div class="stat-card">
        <h3>{{ stats().totalEvents }}</h3>
        <p>Total Event</p>
      </div>
      <div class="stat-card">
        <h3>{{ stats().totalRegistrations }}</h3>
        <p>Total Pendaftaran</p>
      </div>
      <div class="stat-card">
        <h3>{{ stats().totalCertificates }}</h3>
        <p>Total Sertifikat</p>
      </div>
    </div>
    
    <div class="card mt-4">
      <h3>Event Terbaru</h3>
      <table *ngIf="events().length > 0; else noData" class="table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Event</th>
            <th>Tanggal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of events(); let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ event.title }}</td>
            <td>{{ event.startAt | date:'mediumDate' }}</td>
            <td><span class="badge" [ngClass]="event.status">{{ event.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <ng-template #noData>
        <p class="text-light">Belum ada event</p>
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
    .badge.DRAFT { background: #f3f4f6; color: #374151; }
    .badge.PUBLISHED { background: #dcfce7; color: #15803d; }
    .badge.COMPLETED { background: #dbeafe; color: #1e40af; }
    .badge.FINISHED { background: #fee2e2; color: #b91c1c; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    totalCertificates: 0
  });
  events = signal<any[]>([]);
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.http.get<{ success: boolean; data: any }>(`${environment.apiUrl}/reports/admin/summary`).subscribe((res) => {
      if (res.success) this.stats.set(res.data);
    });
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/events`).subscribe((res) => {
      if (res.success) this.events.set(res.data.slice(0, 5)); // Limit 5 for dashboard
    });
  }
}
