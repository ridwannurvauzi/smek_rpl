import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Kelola User</h2>
      <button class="btn btn-accent" (click)="openAddModal()">+ Tambah User</button>
    </div>

    <!-- Data Table -->
    <div class="card" style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <table class="table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
            <th style="padding: 0.75rem;">Nama</th>
            <th style="padding: 0.75rem;">Email</th>
            <th style="padding: 0.75rem;">Role</th>
            <th style="padding: 0.75rem;">Status</th>
            <th style="padding: 0.75rem; text-align: right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users()" style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 0.75rem;">{{ user.name }}</td>
            <td style="padding: 0.75rem;">{{ user.email }}</td>
            <td style="padding: 0.75rem;"><span class="badge" [ngClass]="user.role">{{ user.role }}</span></td>
            <td style="padding: 0.75rem;">
              <span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;"
                    [style.background-color]="user.isActive ? '#dcfce7' : '#fee2e2'"
                    [style.color]="user.isActive ? '#15803d' : '#b91c1c'">
                {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td style="padding: 0.75rem; text-align: right;">
              <button class="btn btn-primary btn-sm" (click)="openEditModal(user)" style="margin-right: 0.5rem;">Edit</button>
              <button class="btn btn-danger btn-sm" (click)="deleteUser(user.id)">Hapus</button>
            </td>
          </tr>
          <tr *ngIf="users().length === 0">
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-light);">Belum ada user.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; margin: 10vh auto; position: relative;">
        <h3>{{ isEditMode() ? 'Edit User' : 'Tambah User' }}</h3>
        <button (click)="closeModal()" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" style="margin-top: 1rem;">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input type="text" formControlName="name" placeholder="Masukkan nama lengkap">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Masukkan email">
          </div>
          <div class="form-group" *ngIf="!isEditMode()">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Masukkan password (min. 6 karakter)">
          </div>
          <div class="form-group">
            <label>Role</label>
            <select formControlName="role">
              <option value="ADMIN">ADMIN</option>
              <option value="PANITIA">PANITIA</option>
              <option value="PESERTA">PESERTA</option>
            </select>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <input type="checkbox" formControlName="isActive" id="isActive" style="width: auto; margin-bottom: 0;">
            <label for="isActive" style="display: inline; margin-bottom: 0;">Status Aktif</label>
          </div>

          <div *ngIf="formError()" class="error-msg" style="color: var(--danger-color); margin-bottom: 1rem;">{{ formError() }}</div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Batal</button>
            <button type="submit" class="btn btn-accent" [disabled]="userForm.invalid">{{ isEditMode() ? 'Simpan' : 'Tambah' }}</button>
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
    .badge.ADMIN { background: #dbeafe; color: #1e40af; }
    .badge.PANITIA { background: #fef3c7; color: #92400e; }
    .badge.PESERTA { background: #f3f4f6; color: #374151; }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  selectedUserId = signal<string | null>(null);
  formError = signal('');

  userForm: FormGroup;
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: ['PESERTA', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<{ success: boolean; data: User[] }>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        if (res.success) this.users.set(res.data);
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.selectedUserId.set(null);
    this.formError.set('');
    this.userForm.reset({
      role: 'PESERTA',
      isActive: true
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.isEditMode.set(true);
    this.selectedUserId.set(user.id);
    this.formError.set('');
    this.userForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  deleteUser(id: string) {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      this.http.delete<{ success: boolean }>(`${environment.apiUrl}/users/${id}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsers();
          }
        }
      });
    }
  }

  onSubmit() {
    if (this.userForm.valid) {
      const payload = { ...this.userForm.value };
      if (this.isEditMode()) {
        if (!payload.password) delete payload.password; // Don't send empty password
        this.http.patch<{ success: boolean }>(`${environment.apiUrl}/users/${this.selectedUserId()}`, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.loadUsers();
              this.closeModal();
            }
          },
          error: (err) => {
            this.formError.set(err.error?.message || 'Gagal menyimpan user');
          }
        });
      } else {
        this.http.post<{ success: boolean }>(`${environment.apiUrl}/users`, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.loadUsers();
              this.closeModal();
            }
          },
          error: (err) => {
            this.formError.set(err.error?.message || 'Gagal menambahkan user');
          }
        });
      }
    }
  }
}
