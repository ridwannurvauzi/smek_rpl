import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'danger' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'danger' | 'info' = 'info') {
    const id = Date.now();
    this.toasts.update(t => [...t, { message, type, id }]);
    setTimeout(() => this.remove(id), 3000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  danger(message: string) {
    this.show(message, 'danger');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
