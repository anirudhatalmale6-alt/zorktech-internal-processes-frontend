import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface PageState {
  /** 1-based, because it is shown to the user. */
  page: number;
  pageSize: number;
}

const PAGE_SIZES = [25, 50, 100];

/**
 * Pager for server-paginated lists.
 *
 * Shows a total count, because "Page 3 of 12" without a total leaves people
 * unable to tell whether their filter matched 60 records or 600 — which is
 * usually the thing they are actually trying to find out.
 */
@Component({
  selector: 'zt-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="pager">
      <p class="pager__summary">
        @if (total() === 0) {
          No results
        } @else {
          Showing
          <strong class="u-numeric">{{ firstRow() | number }}–{{ lastRow() | number }}</strong>
          of <strong class="u-numeric">{{ total() | number }}</strong>
        }
      </p>

      <div class="pager__controls">
        <label class="pager__size">
          <span class="pager__size-label">Rows</span>
          <select
            class="select pager__select"
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
            aria-label="Rows per page"
          >
            @for (size of pageSizes; track size) {
              <option [value]="size">{{ size }}</option>
            }
          </select>
        </label>

        <nav class="pager__nav" aria-label="Pagination">
          <button
            type="button"
            class="btn btn--secondary btn--sm btn--icon"
            [disabled]="page() <= 1"
            (click)="goTo(page() - 1)"
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6z" />
            </svg>
          </button>

          <span class="pager__position">
            Page <strong class="u-numeric">{{ page() }}</strong> of
            <strong class="u-numeric">{{ totalPages() }}</strong>
          </span>

          <button
            type="button"
            class="btn btn--secondary btn--sm btn--icon"
            [disabled]="page() >= totalPages()"
            (click)="goTo(page() + 1)"
            aria-label="Next page"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6z" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  `,
  styleUrl: './pagination.scss',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();

  readonly pageChange = output<PageState>();

  readonly pageSizes = PAGE_SIZES;

  // Never report 0 pages: "Page 1 of 0" is nonsense on an empty result set.
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  readonly firstRow = computed(() => (this.page() - 1) * this.pageSize() + 1);

  // Clamped to the total so the last page reads "76–83 of 83", not "76–100".
  readonly lastRow = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  goTo(page: number): void {
    const target = Math.min(Math.max(page, 1), this.totalPages());

    if (target !== this.page()) {
      this.pageChange.emit({ page: target, pageSize: this.pageSize() });
    }
  }

  onPageSizeChange(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);

    // Always return to page 1. Staying on page 8 while switching 25 -> 100
    // rows can land past the end of the result set, and the user gets an empty
    // table that looks exactly like a filter matching nothing.
    this.pageChange.emit({ page: 1, pageSize });
  }
}
