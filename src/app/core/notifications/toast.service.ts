import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Errors stay until dismissed; everything else auto-hides. */
  sticky: boolean;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly Toast[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message, false);
  }

  info(message: string): void {
    this.push('info', message, false);
  }

  warning(message: string): void {
    this.push('warning', message, false);
  }

  error(message: string): void {
    this.push('error', message, true);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string, sticky: boolean): void {
    // Collapse duplicates. A failing poll that fires every few seconds would
    // otherwise stack forty identical "server unavailable" cards down the
    // screen and bury the rest of the UI.
    const existing = this.items().find((toast) => toast.kind === kind && toast.message === message);

    if (existing) {
      return;
    }

    const toast: Toast = { id: this.nextId++, kind, message, sticky };

    this.items.update((current) => [...current, toast]);

    if (!sticky) {
      this.timers.set(
        toast.id,
        setTimeout(() => this.dismiss(toast.id), AUTO_DISMISS_MS),
      );
    }
  }
}
