import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Committee {
  id: string;
  userId: string;
  eventId: string;
  user: User;
  canManageEvent: boolean;
  canValidateRegistration: boolean;
  canRecordAttendance: boolean;
  canGenerateCertificate: boolean;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Kelola Event</h2>
      <button class="btn btn-accent" (click)="openAddModal()">+ Tambah Event</button>
    </div>

    <!-- Data Table -->
    <div class="card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <table class="table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
            <th style="padding: 0.75rem; width: 80px;">Banner</th>
            <th style="padding: 0.75rem;">Nama Event</th>
            <th style="padding: 0.75rem;">Lokasi</th>
            <th style="padding: 0.75rem;">Tanggal</th>
            <th style="padding: 0.75rem;">Kuota</th>
            <th style="padding: 0.75rem;">Status</th>
            <th style="padding: 0.75rem; text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of events()" style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.75rem;">
              <img *ngIf="event.bannerUrl" [src]="event.bannerUrl" alt="Banner" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
              <div *ngIf="!event.bannerUrl" style="width: 60px; height: 40px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: var(--text-light)">No Img</div>
            </td>
            <td style="padding: 0.75rem;">
              <strong>{{ event.title }}</strong>
              <div style="font-size: 0.75rem; color: var(--text-light)">{{ event.description | slice:0:60 }}...</div>
            </td>
            <td style="padding: 0.75rem;">{{ event.location }}</td>
            <td style="padding: 0.75rem; font-size: 0.825rem;">
              {{ event.startAt | date:'shortDate' }} - {{ event.endAt | date:'shortDate' }}
            </td>
            <td style="padding: 0.75rem;">{{ event.quota }}</td>
            <td style="padding: 0.75rem;">
              <span class="badge" [ngClass]="event.status">{{ event.status }}</span>
            </td>
            <td style="padding: 0.75rem; text-align: right; display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center; min-height: 52px;">
              <button class="btn btn-primary btn-sm" (click)="openEditModal(event)">Edit</button>
              <button class="btn btn-accent btn-sm" (click)="openCommitteeModal(event)">Panitia</button>
              <button *ngIf="event.status === 'DRAFT'" class="btn btn-accent btn-sm" (click)="updateStatus(event.id, 'PUBLISHED')" style="background-color: var(--success-color)">Publish</button>
              <button *ngIf="event.status === 'PUBLISHED'" class="btn btn-secondary btn-sm" (click)="updateStatus(event.id, 'COMPLETED')">Complete</button>
              <button class="btn btn-danger btn-sm" (click)="deleteEvent(event.id)">Hapus</button>
            </td>
          </tr>
          <tr *ngIf="events().length === 0">
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">Belum ada event.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Event CRUD Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 600px; margin: 5vh auto; position: relative;">
        <h3>{{ isEditMode() ? 'Edit Event' : 'Tambah Event' }}</h3>
        <button (click)="closeModal()" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" style="margin-top: 1rem;">
          <div class="form-group">
            <label>Nama Event</label>
            <input type="text" formControlName="title" placeholder="Masukkan nama event">
          </div>
          <div class="form-group">
            <label>Deskripsi</label>
            <textarea formControlName="description" rows="3" placeholder="Masukkan deskripsi event"></textarea>
          </div>
          
          <!-- Image/Thumbnail Upload -->
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label>Thumbnail / Banner Event</label>
            <div style="display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
              <div style="width: 100px; height: 60px; border: 1px solid var(--border-color); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f8fafc;">
                <img *ngIf="bannerBase64()" [src]="bannerBase64()" style="width: 100%; height: 100%; object-fit: cover;">
                <span *ngIf="!bannerBase64()" style="font-size: 0.75rem; color: var(--text-light)">No Image</span>
              </div>
              <div style="flex: 1;">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" style="margin-bottom: 0.25rem;">
                <div style="font-size: 0.7rem; color: var(--text-light)">Pilih file gambar untuk thumbnail event</div>
                <button type="button" *ngIf="bannerBase64()" (click)="removeBanner()" class="btn btn-danger btn-sm" style="margin-top: 0.25rem; padding: 0.15rem 0.4rem; font-size: 0.7rem;">Hapus Gambar</button>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>Tanggal Mulai</label>
              <input type="datetime-local" formControlName="startAt">
            </div>
            <div class="form-group">
              <label>Tanggal Selesai</label>
              <input type="datetime-local" formControlName="endAt">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>Lokasi</label>
              <input type="text" formControlName="location" placeholder="Lokasi event / Zoom Link">
            </div>
            <div class="form-group">
              <label>Kuota Peserta</label>
              <input type="number" formControlName="quota">
            </div>
          </div>

          <div *ngIf="formError()" class="error-msg" style="color: var(--danger-color); margin-bottom: 1rem;">{{ formError() }}</div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Batal</button>
            <button type="submit" class="btn btn-accent" [disabled]="eventForm.invalid">{{ isEditMode() ? 'Simpan' : 'Tambah' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Committee Assignment Modal -->
    <div class="modal-backdrop" *ngIf="isCommitteeModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 700px; margin: 5vh auto; position: relative;">
        <h3>Kelola Panitia - {{ selectedEvent()?.title }}</h3>
        <button (click)="closeCommitteeModal()" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <!-- Left: Assign Panitia Form -->
          <div>
            <h4>Tugaskan Panitia Baru</h4>
            <form [formGroup]="committeeForm" (ngSubmit)="assignCommittee()" style="margin-top: 1rem;">
              <div class="form-group">
                <label>Pilih Panitia</label>
                <select formControlName="userId">
                  <option value="">-- Pilih Panitia --</option>
                  <option *ngFor="let p of panitiaList()" [value]="p.id">{{ p.name }} ({{ p.email }})</option>
                </select>
              </div>
              
              <div style="margin-bottom: 1rem;">
                <label style="font-weight: bold; font-size: 0.875rem;">Hak Akses / Izin:</label>
                <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem;">
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; margin-bottom: 0;">
                    <input type="checkbox" formControlName="canManageEvent" style="width: auto; margin-bottom:0"> Kelola Detail Event
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; margin-bottom: 0;">
                    <input type="checkbox" formControlName="canValidateRegistration" style="width: auto; margin-bottom:0"> Validasi Peserta
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; margin-bottom: 0;">
                    <input type="checkbox" formControlName="canRecordAttendance" style="width: auto; margin-bottom:0"> Catat Kehadiran (Presensi)
                  </label>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal; margin-bottom: 0;">
                    <input type="checkbox" formControlName="canGenerateCertificate" style="width: auto; margin-bottom:0"> Terbitkan Sertifikat
                  </label>
                </div>
              </div>

              <div *ngIf="committeeFormError()" style="color: var(--danger-color); font-size: 0.875rem; margin-bottom: 1rem;">{{ committeeFormError() }}</div>
              
              <button type="submit" class="btn btn-accent w-100" [disabled]="committeeForm.invalid">Tugaskan</button>
            </form>
          </div>

          <!-- Right: Assigned Committee List -->
          <div>
            <h4>Panitia yang Ditugaskan</h4>
            <div style="margin-top: 1rem; max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem;">
              <div *ngFor="let c of assignedCommittees()" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding: 0.5rem 0;">
                <div>
                  <strong>{{ c.user.name }}</strong>
                  <div style="font-size: 0.7rem; color: var(--text-light)">
                    {{ c.canManageEvent ? 'Manage ' : '' }}
                    {{ c.canValidateRegistration ? 'Validate ' : '' }}
                    {{ c.canRecordAttendance ? 'Presensi ' : '' }}
                    {{ c.canGenerateCertificate ? 'Sertifikat ' : '' }}
                  </div>
                </div>
                <button class="btn btn-danger btn-sm" (click)="removeCommittee(c.id)">Hapus</button>
              </div>
              <div *ngIf="assignedCommittees().length === 0" style="text-align: center; color: var(--text-light); padding: 1.5rem 0;">
                Belum ada panitia ditugaskan.
              </div>
            </div>
          </div>
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
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .badge.DRAFT { background: #f3f4f6; color: #374151; }
    .badge.PUBLISHED { background: #dcfce7; color: #15803d; }
    .badge.COMPLETED { background: #dbeafe; color: #1e40af; }
  `]
})
export class EventsComponent implements OnInit {
  events = signal<Event[]>([]);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedEventId = signal<string | null>(null);
  formError = signal('');
  bannerBase64 = signal<string>(''); // Holds Base64 banner image string

  // Committee related states
  isCommitteeModalOpen = signal(false);
  selectedEvent = signal<Event | null>(null);
  panitiaList = signal<User[]>([]);
  assignedCommittees = signal<Committee[]>([]);
  committeeFormError = signal('');

  eventForm: FormGroup;
  committeeForm: FormGroup;

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  constructor() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      startAt: ['', [Validators.required]],
      endAt: ['', [Validators.required]],
      location: ['', [Validators.required]],
      quota: [100, [Validators.required, Validators.min(1)]]
    });

    this.committeeForm = this.fb.group({
      userId: ['', [Validators.required]],
      canManageEvent: [true],
      canValidateRegistration: [true],
      canRecordAttendance: [true],
      canGenerateCertificate: [true]
    });
  }

  ngOnInit() {
    this.loadEvents();
    this.loadPanitiaList();
  }

  loadEvents() {
    this.http.get<{ success: boolean; data: Event[] }>(`${environment.apiUrl}/events`).subscribe({
      next: (res) => {
        if (res.success) this.events.set(res.data);
      }
    });
  }

  loadPanitiaList() {
    this.http.get<{ success: boolean; data: User[] }>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        if (res.success) {
          const onlyPanitia = res.data.filter(u => u.role === 'PANITIA');
          this.panitiaList.set(onlyPanitia);
        }
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedEventId.set(null);
    this.formError.set('');
    this.bannerBase64.set('');
    this.eventForm.reset({
      quota: 100
    });
    this.isModalOpen.set(true);
  }

  openEditModal(event: Event) {
    this.isEditMode.set(true);
    this.selectedEventId.set(event.id);
    this.formError.set('');
    this.bannerBase64.set(event.bannerUrl || '');
    
    // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
    const startStr = event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '';
    const endStr = event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '';

    this.eventForm.reset({
      title: event.title,
      description: event.description,
      startAt: startStr,
      endAt: endStr,
      location: event.location,
      quota: event.quota
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  // Handle Thumbnail File Selection
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.bannerBase64.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeBanner() {
    this.bannerBase64.set('');
  }

  updateStatus(id: string, status: string) {
    this.http.patch<{ success: boolean }>(`${environment.apiUrl}/events/${id}/status`, { status }).subscribe({
      next: (res) => {
        if (res.success) this.loadEvents();
      }
    });
  }

  deleteEvent(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus event ini?')) {
      this.http.delete<{ success: boolean }>(`${environment.apiUrl}/events/${id}`).subscribe({
        next: (res) => {
          if (res.success) this.loadEvents();
        }
      });
    }
  }

  onSubmit() {
    if (this.eventForm.valid) {
      const payload = {
        ...this.eventForm.value,
        quota: Number(this.eventForm.value.quota),
        startAt: new Date(this.eventForm.value.startAt).toISOString(),
        endAt: new Date(this.eventForm.value.endAt).toISOString(),
        bannerUrl: this.bannerBase64() || null
      };

      if (this.isEditMode()) {
        this.http.patch<{ success: boolean }>(`${environment.apiUrl}/events/${this.selectedEventId()}`, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.loadEvents();
              this.closeModal();
            }
          },
          error: (err) => {
            this.formError.set(err.error?.message || 'Gagal menyimpan event');
          }
        });
      } else {
        this.http.post<{ success: boolean }>(`${environment.apiUrl}/events`, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.loadEvents();
              this.closeModal();
            }
          },
          error: (err) => {
            this.formError.set(err.error?.message || 'Gagal menambahkan event');
          }
        });
      }
    }
  }

  // Committee Actions
  openCommitteeModal(event: Event) {
    this.selectedEvent.set(event);
    this.committeeFormError.set('');
    this.committeeForm.reset({
      userId: '',
      canManageEvent: true,
      canValidateRegistration: true,
      canRecordAttendance: true,
      canGenerateCertificate: true
    });
    this.loadCommittees(event.id);
    this.isCommitteeModalOpen.set(true);
  }

  closeCommitteeModal() {
    this.isCommitteeModalOpen.set(false);
  }

  loadCommittees(eventId: string) {
    this.http.get<{ success: boolean; data: Committee[] }>(`${environment.apiUrl}/events/${eventId}/committees`).subscribe({
      next: (res) => {
        if (res.success) this.assignedCommittees.set(res.data);
      }
    });
  }

  assignCommittee() {
    const event = this.selectedEvent();
    if (event && this.committeeForm.valid) {
      this.committeeFormError.set('');
      this.http.post<{ success: boolean }>(`${environment.apiUrl}/events/${event.id}/committees`, this.committeeForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadCommittees(event.id);
            this.committeeForm.reset({
              userId: '',
              canManageEvent: true,
              canValidateRegistration: true,
              canRecordAttendance: true,
              canGenerateCertificate: true
            });
          }
        },
        error: (err) => {
          this.committeeFormError.set(err.error?.message || 'Gagal menugaskan panitia');
        }
      });
    }
  }

  removeCommittee(committeeId: string) {
    const event = this.selectedEvent();
    if (event && confirm('Apakah Anda yakin ingin menghapus panitia ini dari event?')) {
      this.http.delete<{ success: boolean }>(`${environment.apiUrl}/events/${event.id}/committees/${committeeId}`).subscribe({
        next: (res) => {
          if (res.success) this.loadCommittees(event.id);
        }
      });
    }
  }
}
