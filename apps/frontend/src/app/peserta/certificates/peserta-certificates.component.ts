import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';

interface Certificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  registration: {
    event: {
      title: string;
      startAt: string;
    };
  };
}

@Component({
  selector: 'app-peserta-certificates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header" style="margin-bottom: 1.5rem;">
      <h2>Sertifikat Digital Saya</h2>
      <p style="margin: 0; color: var(--text-light)">Unduh dan cetak sertifikat kehadiran event Anda di sini.</p>
    </div>

    <!-- Certificates Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
      <div *ngFor="let cert of certificates()" class="card" style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid var(--success-color); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; height: 180px;">
        <div>
          <h4 style="margin-bottom: 0.25rem; font-size: 1.1rem;">{{ cert.registration?.event?.title }}</h4>
          <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.75rem;">
            Nomor: {{ cert.certificateNumber }}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-main)">
            Diterbitkan: {{ cert.issuedAt | date:'mediumDate' }}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-light)">Verifikasi: {{ cert.verificationCode }}</span>
          <button class="btn btn-accent btn-sm" (click)="openCertificateModal(cert)">Cetak / Unduh</button>
        </div>
      </div>
    </div>

    <div *ngIf="certificates().length === 0" class="card" style="text-align: center; padding: 4rem; color: var(--text-light);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
      <h3>Belum Ada Sertifikat</h3>
      <p>Sertifikat akan otomatis diterbitkan oleh panitia setelah Anda menghadiri event yang Anda ikuti.</p>
    </div>

    <!-- Certificate View & Print Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 750px; margin: 5vh auto; position: relative;">
        <button (click)="closeModal()" class="no-print" style="position: absolute; top: 1rem; right: 1rem; border: none; background: transparent; font-size: 1.5rem; cursor: pointer;">&times;</button>
        
        <!-- Printable Certificate Area -->
        <div id="print-area" class="certificate-container" style="border: 10px double var(--success-color); padding: 3rem 2rem; text-align: center; background: #faf9f6; position: relative; font-family: 'Georgia', serif; color: #1e293b;">
          <!-- Corner decorations -->
          <div style="font-size: 1.5rem; color: var(--success-color); font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); text-transform: uppercase; letter-spacing: 2px;">
            Sertifikat Penghargaan
          </div>
          <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.5rem; font-family: sans-serif; letter-spacing: 1px;">
            SISTEM MANAJEMEN EVENT KAMPUS (SMEK)
          </div>
          
          <div style="margin: 2.5rem 0;">
            <span style="font-style: italic; font-size: 1.1rem; color: var(--text-light);">Diberikan kepada:</span>
            <h2 style="font-size: 2.2rem; margin: 0.5rem 0; text-decoration: underline; color: #0f172a; font-family: 'Times New Roman', serif;">{{ userName() }}</h2>
            <p style="font-size: 0.95rem; font-family: sans-serif; color: var(--text-main); max-width: 500px; margin: 1rem auto auto auto; line-height: 1.5;">
              Atas partisipasi aktif dan kehadirannya sebagai <strong>Peserta</strong> pada kegiatan event kampus:
            </p>
            <h3 style="font-size: 1.6rem; color: var(--accent-color); margin: 0.75rem 0;">{{ selectedCert()?.registration?.event?.title }}</h3>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3rem; font-family: sans-serif; font-size: 0.8rem; border-top: 1px dashed var(--border-color); padding-top: 1.5rem;">
            <div style="text-align: left;">
              <div>Nomor Sertifikat: {{ selectedCert()?.certificateNumber }}</div>
              <div>Kode Verifikasi: <strong>{{ selectedCert()?.verificationCode }}</strong></div>
            </div>
            <div style="text-align: right;">
              <div>Tanggal Terbit: {{ selectedCert()?.issuedAt | date:'mediumDate' }}</div>
              <div style="margin-top: 1rem; font-weight: bold; border-top: 1px solid #1e293b; padding-top: 0.25rem;">Panitia Penyelenggara SMEK</div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;" class="no-print">
          <button class="btn btn-secondary" (click)="closeModal()">Tutup</button>
          <button class="btn btn-accent" (click)="printCertificate()">Cetak / Simpan PDF</button>
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
    
    @media print {
      body * {
        visibility: hidden;
      }
      #print-area, #print-area * {
        visibility: visible;
      }
      #print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        border: 10px double #22c55e !important;
        padding: 3rem 2rem !important;
        background: #faf9f6 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
  `]
})
export class PesertaCertificatesComponent implements OnInit {
  certificates = signal<Certificate[]>([]);
  isModalOpen = signal(false);
  selectedCert = signal<Certificate | null>(null);
  userName = signal('');

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  ngOnInit() {
    this.loadCertificates();
    this.userName.set(this.authService.currentUserValue?.name || 'Peserta');
  }

  loadCertificates() {
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/my/certificates`).subscribe({
      next: (res) => {
        if (res.success) {
          // Map backend response structure
          const mapped = res.data.map(item => ({
            id: item.id,
            certificateNumber: item.certificateNumber,
            verificationCode: item.verificationCode,
            issuedAt: item.issuedAt,
            registration: {
              event: {
                title: item.registration?.event?.title || 'Event Kampus',
                startAt: item.registration?.event?.startAt || ''
              }
            }
          }));
          this.certificates.set(mapped);
        }
      }
    });
  }

  openCertificateModal(cert: Certificate) {
    this.selectedCert.set(cert);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  printCertificate() {
    window.print();
  }
}
