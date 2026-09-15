import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/**
 * KPI tile: one figure, a label, and an optional period-on-period delta.
 *
 * `delta` is a fraction (0.082 = +8.2%), not a pre-formatted string, so the
 * tile owns the sign, the rounding and the wording. Passing formatted text in
 * is how two tiles on the same row end up disagreeing on decimal places.
 */
@Component({
  selector: 'zt-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="tile">
      <p class="tile__label">{{ label() }}</p>

      <p class="tile__value">
        @if (prefix()) {
          <span class="tile__affix">{{ prefix() }}</span>
        }
        {{ value() | number: format() }}
        @if (suffix()) {
          <span class="tile__affix">{{ suffix() }}</span>
        }
      </p>

      @if (delta() !== null) {
        <!-- Arrow follows the movement; colour follows whether that movement
             is good news, which is not the same question. -->
        <p class="tile__delta" [class]="'tile__delta--' + tone()">
          <svg class="tile__arrow" viewBox="0 0 24 24" aria-hidden="true">
            @if (direction() === 'down') {
              <path fill="currentColor" d="M12 18 6 12h4V6h4v6h4l-6 6z" />
            } @else if (direction() === 'up') {
              <path fill="currentColor" d="m12 6 6 6h-4v6h-4v-6H6l6-6z" />
            } @else {
              <path fill="currentColor" d="M6 11h12v2H6z" />
            }
          </svg>

          <span>{{ deltaPercent() }}</span>
          <span class="tile__delta-caption">{{ deltaCaption() }}</span>
        </p>
      }
    </div>
  `,
  styleUrl: './stat-tile.scss',
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<number>();

  /** Angular DecimalPipe format, e.g. '1.0-0' for whole numbers. */
  readonly format = input('1.0-0');
  readonly prefix = input<string>('');
  readonly suffix = input<string>('');

  /** Fractional change vs the comparison period. null hides the row. */
  readonly delta = input<number | null>(null);
  readonly deltaCaption = input('vs last period');

  /**
   * Whether a rise is good news.
   *
   * Set false for metrics where up is bad — open incidents, average handling
   * time, rejections. Colouring a rising backlog green because "up is good" is
   * a dashboard actively misleading the person reading it.
   */
  readonly higherIsBetter = input(true);

  readonly direction = computed<'up' | 'down' | 'flat'>(() => {
    const value = this.delta();

    if (value === null || Math.abs(value) < 0.0005) {
      return 'flat';
    }

    return value > 0 ? 'up' : 'down';
  });

  /** 'good' | 'bad' | 'flat' drives the colour, separately from the arrow. */
  readonly tone = computed<'good' | 'bad' | 'flat'>(() => {
    const direction = this.direction();

    if (direction === 'flat') {
      return 'flat';
    }

    const rising = direction === 'up';

    return rising === this.higherIsBetter() ? 'good' : 'bad';
  });

  readonly deltaPercent = computed(() => {
    const value = this.delta();

    if (value === null) {
      return '';
    }

    const percent = value * 100;
    const sign = percent > 0 ? '+' : '';

    return `${sign}${percent.toFixed(1)}%`;
  });
}
