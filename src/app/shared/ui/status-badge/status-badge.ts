import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Small state pill for tables and detail headers.
 *
 * Carries a dot as well as a colour: roughly one man in twelve has some form
 * of colour-vision deficiency, and a red/green pill pair with identical shape
 * is the single most common way an operations table becomes unreadable for
 * them. The label text does the real work; colour is reinforcement.
 */
@Component({
  selector: 'zt-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge--' + tone()">
      <span class="badge__dot" aria-hidden="true"></span>
      <span class="badge__label">{{ label() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      line-height: 1rem;
      white-space: nowrap;
      border-radius: var(--radius-sm);
    }

    .badge__dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: var(--radius-full);
      background: currentcolor;
      flex-shrink: 0;
    }

    .badge--success {
      color: var(--status-success);
      background: var(--status-success-subtle);
    }

    .badge--warning {
      color: var(--status-warning);
      background: var(--status-warning-subtle);
    }

    .badge--danger {
      color: var(--status-danger);
      background: var(--status-danger-subtle);
    }

    .badge--info {
      color: var(--status-info);
      background: var(--status-info-subtle);
    }

    .badge--neutral {
      color: var(--status-neutral);
      background: var(--status-neutral-subtle);
    }
  `,
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('neutral');
}
