import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2 class="text-center">Daftar Akun</h2>
        <p class="text-center text-light mb-4">Sistem Manajemen Event Kampus (SMEK)</p>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input type="text" formControlName="name" placeholder="Masukkan nama lengkap">
          </div>
          <div class="form-group">
            <label>NIM (Nomor Induk Mahasiswa)</label>
            <input type="text" formControlName="nim" placeholder="Masukkan NIM Anda (opsional)">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Masukkan email aktif">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Masukkan password (min. 6 karakter)">
          </div>
          <div class="form-group">
            <label>Nomor HP</label>
            <input type="text" formControlName="phone" placeholder="Contoh: 08123456789 (opsional)">
          </div>
          
          <div *ngIf="error()" class="error-msg">{{ error() }}</div>
          
          <button type="submit" class="btn btn-accent w-100" [disabled]="registerForm.invalid || isLoading()">
            {{ isLoading() ? 'Mendaftar...' : 'DAFTAR SEKARANG' }}
          </button>
        </form>
        
        <div class="text-center mt-4">
          <small class="text-light">Sudah punya akun? <a routerLink="/login">Masuk di sini</a></small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--secondary-color);
      padding: 1.5rem;
    }
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100%;
      max-width: 450px;
    }
    .text-center { text-align: center; }
    .text-light { color: var(--text-light); }
    .mb-4 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1.5rem; }
    .w-100 { width: 100%; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
    .error-msg { color: var(--danger-color); font-size: 0.875rem; margin-bottom: 1rem; text-align: center; }
    a { color: var(--accent-color); text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  error = signal('');

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      nim: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['']
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.error.set('');
      this.authService.register(this.registerForm.value).subscribe({
        next: (res) => {
          alert('Akun berhasil dibuat! Silakan login.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Registrasi gagal. Hubungi admin.');
        }
      });
    }
  }
}
