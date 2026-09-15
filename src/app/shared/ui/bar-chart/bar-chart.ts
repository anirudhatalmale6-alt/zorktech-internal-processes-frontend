import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarSeries {
  key: string;
  label: string;
  /** CSS colour. Defaults walk the brand palette. */
  color?: string;
  values: readonly number[];
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 32, left: 44 };
const GRID_LINES = 4;

/**
 * Grouped bar chart, drawn as inline SVG.
 *
 * Hand-rolled rather than pulled from a charting library on purpose: the
 * dashboard needs two or three chart types, all of them simple, and every
 * library worth using adds 60–200 KB plus its own opinions about colour that
 * then have to be fought back into line with the brand guide. If the final
 * requirements turn out to need zooming, brushing or live streaming, this gets
 * swapped for a real library — the component boundary means nothing else
 * changes.
 *
 * The SVG uses a viewBox and no fixed pixel size, so it scales to its
 * container without a resize observer.
 */
@Component({
  selector: 'zt-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChart {
  readonly categories = input.required<readonly string[]>();
  readonly series = input.required<readonly BarSeries[]>();
  readonly valueSuffix = input('');

  readonly width = CHART_WIDTH;
  readonly height = CHART_HEIGHT;
  readonly padding = PADDING;

  readonly plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  readonly plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  private readonly defaultColors = [
    'var(--brand-primary)',
    'var(--brand-secondary)',
    'var(--brand-accent)',
  ];

  /**
   * Upper bound of the y-axis, rounded up to a readable step.
   *
   * Axes must start at zero for bars. A bar chart with a truncated axis
   * exaggerates differences — a 5% gap can be made to look like a doubling —
   * and on an internal dashboard that drives decisions, that is not a styling
   * choice, it is a wrong chart.
   */
  readonly maxValue = computed(() => {
    const values = this.series().flatMap((item) => [...item.values]);
    const peak = values.length ? Math.max(...values) : 0;

    if (peak <= 0) {
      return GRID_LINES; // empty data still needs a sane axis
    }

    // Round up to a whole number of grid steps so the labels are tidy.
    const rawStep = peak / GRID_LINES;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;

    return niceStep * GRID_LINES;
  });

  readonly gridValues = computed(() => {
    const max = this.maxValue();

    return Array.from({ length: GRID_LINES + 1 }, (_, index) => (max / GRID_LINES) * index);
  });

  /** Positioned bars, precomputed so the template stays free of arithmetic. */
  readonly bars = computed(() => {
    const categories = this.categories();
    const series = this.series();
    const max = this.maxValue();

    if (!categories.length || !series.length) {
      return [];
    }

    const groupWidth = this.plotWidth / categories.length;
    const groupPadding = groupWidth * 0.22;
    const barWidth = (groupWidth - groupPadding) / series.length;

    return categories.flatMap((category, categoryIndex) =>
      series.map((item, seriesIndex) => {
        const value = item.values[categoryIndex] ?? 0;
        const barHeight = max > 0 ? (value / max) * this.plotHeight : 0;

        return {
          key: `${item.key}-${categoryIndex}`,
          label: `${category} · ${item.label}: ${value}${this.valueSuffix()}`,
          color: item.color ?? this.defaultColors[seriesIndex % this.defaultColors.length],
          x:
            this.padding.left +
            categoryIndex * groupWidth +
            groupPadding / 2 +
            seriesIndex * barWidth,
          // A zero-value bar would be invisible; 2px keeps it present as a
          // deliberate "this category reported zero" rather than a gap.
          y: this.padding.top + this.plotHeight - Math.max(barHeight, value > 0 ? 2 : 0),
          width: Math.max(barWidth - 2, 1),
          height: Math.max(barHeight, value > 0 ? 2 : 0),
        };
      }),
    );
  });

  readonly categoryTicks = computed(() => {
    const categories = this.categories();

    if (!categories.length) {
      return [];
    }

    const groupWidth = this.plotWidth / categories.length;

    return categories.map((label, index) => ({
      label,
      x: this.padding.left + index * groupWidth + groupWidth / 2,
    }));
  });

  yFor(value: number): number {
    const max = this.maxValue();
    const ratio = max > 0 ? value / max : 0;

    return this.padding.top + this.plotHeight - ratio * this.plotHeight;
  }

  colorFor(item: BarSeries, index: number): string {
    return item.color ?? this.defaultColors[index % this.defaultColors.length];
  }
}
