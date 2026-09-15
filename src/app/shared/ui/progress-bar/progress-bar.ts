import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Inline progress bar with its numeric value beside it.
 *
 * The number is not decoration. A bar alone forces people to estimate a
 * percentage by eye, and at the widths a table cell allows, 62% and 71% are
 * indistinguishable. It also carries the accessible value, so the control
 * means something without sight of the bar.
 */
@Component({
  selector: 'zt-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress" [attr.title]="clamped() + '% complete'">
      <div
        class="progress__track"
        role="progressbar"
        [attr.aria-valuenow]="clamped()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label()"
      >
        <span
          class="progress__fill"
          [class.progress__fill--complete]="clamped() === 100"
          [style.width.%]="clamped()"
        ></span>
      </div>

      <span class="progress__value u-numeric">{{ clamped() }}%</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .progress {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
    }

    .progress__track {
      flex: 1;
      height: 0.375rem;
      min-width: 2.5rem;
      background: var(--neutral-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress__fill {
      display: block;
      height: 100%;
      background: var(--brand-primary);
      border-radius: inherit;
      transition: width var(--duration-normal) var(--easing-standard);
    }

    .progress__fill--complete {
      background: var(--status-success);
    }

    .progress__value {
      flex-shrink: 0;
      min-width: 2.5rem;
      text-align: right;
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }
  `,
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly label = input('Progress');

  /**
   * Clamped to 0–100.
   *
   * A backend that reports 104% — and they do, when a stage count drifts —
   * would otherwise render a fill wider than its track and spill over the
   * neighbouring cell.
   */
  readonly clamped = computed(() => Math.min(100, Math.max(0, Math.round(this.value()))));
}
