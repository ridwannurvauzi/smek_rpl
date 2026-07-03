import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <img src="/LOGO-SMEK-baru2.png" alt="Logo SMEK" style="height: 60px; max-width: 100%; object-fit: contain; margin-bottom: 0.5rem;">
          <p class="text-light" style="margin: 0; font-size: 0.9rem;">Sistem Manajemen Event Kampus</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Masukkan email">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Masukkan password">
          </div>
          
          <div *ngIf="error()" class="error-msg">{{ error() }}</div>
          
          <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid || isLoading()">
            {{ isLoading() ? 'Loading...' : 'LOGIN' }}
          </button>
        </form>
        
        <div class="text-center mt-4">
          <small class="text-light">Belum punya akun? <a routerLink="/register">Daftar Akun</a></small>
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
    }
    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100%;
      max-width: 400px;
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  error = signal('');

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set('');
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          const role = this.authService.currentUserValue?.role;
          if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
          else if (role === 'PANITIA') this.router.navigate(['/panitia/dashboard']);
          else if (role === 'PESERTA') this.router.navigate(['/peserta/dashboard']);
          else this.router.navigate(['/']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set('Email atau password salah');
        }
      });
    }
  }
}
