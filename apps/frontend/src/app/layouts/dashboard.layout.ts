import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <!-- Backdrop for mobile when sidebar is open -->
      <div class="sidebar-backdrop no-print" *ngIf="isSidebarOpen()" (click)="toggleSidebar()"></div>

      <aside class="sidebar no-print" [class.open]="isSidebarOpen()">
        <div class="sidebar-header" style="display: flex; align-items: center; justify-content: flex-start; padding: 1.25rem 1.5rem; height: 70px; box-sizing: border-box;">
          <img src="/LOGO-SMEK-baru.png" alt="Logo SMEK" style="height: 42px; width: auto; max-width: 100%; object-fit: contain;">
          <button class="close-sidebar-btn" (click)="toggleSidebar()">&times;</button>
        </div>
        <div class="sidebar-menu">
          <ng-container *ngIf="role === 'ADMIN'">
            <a routerLink="/admin/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Dashboard</a>
            <a routerLink="/admin/users" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Kelola User</a>
            <a routerLink="/admin/events" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Kelola Event</a>
            <a routerLink="/admin/reports" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Laporan</a>
          </ng-container>
          
          <ng-container *ngIf="role === 'PANITIA'">
            <a routerLink="/panitia/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Dashboard</a>
            <a routerLink="/panitia/events" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Event Saya</a>
            <a routerLink="/panitia/reports" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Laporan</a>
          </ng-container>
          
          <ng-container *ngIf="role === 'PESERTA'">
            <a routerLink="/peserta/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Dashboard</a>
            <a routerLink="/peserta/events" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Daftar Event</a>
            <a routerLink="/peserta/registrations" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Pendaftaran Saya</a>
            <a routerLink="/peserta/certificates" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-link" style="display:block">Sertifikat</a>
          </ng-container>
          
          <a href="javascript:void(0)" (click)="logout()" class="nav-link mt-auto" style="display:block; margin-top: auto;">Logout</a>
        </div>
      </aside>
      
      <main class="main-content">
        <header class="topbar no-print">
          <button class="hamburger-btn" (click)="toggleSidebar()">☰</button>
          <div class="user-info">
            <strong>{{ userName }}</strong> ({{ role }})
          </div>
        </header>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
  `]
})
export class DashboardLayoutComponent {
  role = '';
  userName = '';
  isSidebarOpen = signal(false);

  constructor(public authService: AuthService, private router: Router) {
    const user = this.authService.currentUserValue;
    if (user) {
      this.role = user.role;
      this.userName = user.name;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
