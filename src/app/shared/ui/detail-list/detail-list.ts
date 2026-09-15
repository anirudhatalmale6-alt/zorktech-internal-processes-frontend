import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DetailItem {
  label: string;
  value: string | number | null | undefined;
  /** Renders in the monospace face — for references, IDs, codes. */
  mono?: boolean;
  /** Spans the full width, for long free text like notes or an address. */
  wide?: boolean;
}

/**
 * Label/value panel for the status and summary blocks on detail screens.
 *
 * Renders a real `<dl>`. A grid of divs looks identical and tells assistive
 * technology nothing about which label belongs to which value, which on a
 * status panel is most of the meaning.
 */
@Component({
  selector: 'zt-detail-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="details" [style.--details-columns]="columns()">
      @for (item of items(); track item.label) {
        <div class="details__item" [class.details__item--wide]="item.wide">
          <dt class="details__label">{{ item.label }}</dt>
          <dd class="details__value" [class.details__value--mono]="item.mono">
            {{ display(item) }}
          </dd>
        </div>
      }
    </dl>
  `,
  styleUrl: './detail-list.scss',
})
export class DetailList {
  readonly items = input.required<readonly DetailItem[]>();
  readonly columns = input(2);

  /**
   * Em dash for an absent value, matching the data table.
   *
   * Consistency matters more than it sounds: if a blank means "empty" in the
   * table and "loading" on the detail screen, people stop trusting either.
   */
  display(item: DetailItem): string {
    const { value } = item;

    return value === null || value === undefined || value === '' ? '—' : String(value);
  }
}
