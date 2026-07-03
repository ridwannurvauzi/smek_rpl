import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardLayoutComponent } from './layouts/dashboard.layout';
import { AdminDashboardComponent } from './admin/dashboard/admin-dashboard.component';
import { UsersComponent } from './admin/users/users.component';
import { EventsComponent } from './admin/events/events.component';
import { ReportsComponent } from './admin/reports/reports.component';
import { PanitiaDashboardComponent } from './panitia/dashboard/panitia-dashboard.component';
import { PanitiaEventsComponent } from './panitia/events/panitia-events.component';
import { PanitiaReportsComponent } from './panitia/reports/panitia-reports.component';
import { PesertaDashboardComponent } from './peserta/dashboard/peserta-dashboard.component';
import { PesertaEventsComponent } from './peserta/events/peserta-events.component';
import { PesertaRegistrationsComponent } from './peserta/registrations/peserta-registrations.component';
import { PesertaCertificatesComponent } from './peserta/certificates/peserta-certificates.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'admin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'events', component: EventsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'panitia',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['PANITIA'] },
    children: [
      { path: 'dashboard', component: PanitiaDashboardComponent },
      { path: 'events', component: PanitiaEventsComponent },
      { path: 'reports', component: PanitiaReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'peserta',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['PESERTA'] },
    children: [
      { path: 'dashboard', component: PesertaDashboardComponent },
      { path: 'events', component: PesertaEventsComponent },
      { path: 'registrations', component: PesertaRegistrationsComponent },
      { path: 'certificates', component: PesertaCertificatesComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
