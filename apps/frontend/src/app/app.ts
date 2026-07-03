import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet></router-outlet>
    
    <!-- Floating Toast Container -->
    <div class="toast-container no-print">
      <div *ngFor="let toast of toastService.toasts()" class="toast" [ngClass]="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✔' : toast.type === 'danger' ? '❌' : 'ℹ' }}</span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 320px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: white;
      border-radius: 6px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      border-left: 4px solid var(--accent-color);
      animation: slideIn 0.3s ease-out;
      font-size: 0.875rem;
      color: var(--text-main);
    }
    .toast.success { border-left-color: var(--success-color); }
    .toast.danger { border-left-color: var(--danger-color); }
    .toast.info { border-left-color: var(--accent-color); }
    
    .toast-icon { font-weight: bold; }
    .toast-success .toast-icon { color: var(--success-color); }
    .toast-danger .toast-icon { color: var(--danger-color); }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class App {
  toastService = inject(ToastService);
}
