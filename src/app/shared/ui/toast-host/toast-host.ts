import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../../core/notifications/toast.service';

/**
 * Renders the toast stack. Mounted once, at the app root, so toasts survive
 * navigation — a "saved" confirmation that disappears because the user moved
 * on is worse than no confirmation at all.
 */
@Component({
  selector: 'zt-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
})
export class ToastHost {
  private readonly service = inject(ToastService);

  readonly toasts = this.service.toasts;

  dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
