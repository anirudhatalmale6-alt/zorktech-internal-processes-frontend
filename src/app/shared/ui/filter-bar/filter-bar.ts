import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Toolbar above a list: search box, filter controls, and a clear-all.
 *
 * `activeCount` drives a visible "N filters applied" chip and enables Clear
 * all. It exists because the most common support question about any internal
 * list is "why can't I find record X" and the answer is almost always a filter
 * somebody left set three days ago. Making the count impossible to miss is
 * cheaper than answering that question repeatedly.
 */
@Component({
  selector: 'zt-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <div class="filters__search">
        <svg class="filters__search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"
          />
        </svg>

        <input
          class="input filters__search-input"
          type="search"
          [value]="searchValue()"
          [attr.placeholder]="searchPlaceholder()"
          [attr.aria-label]="searchPlaceholder()"
          (input)="onSearch($event)"
        />
      </div>

      <div class="filters__controls">
        <ng-content />
      </div>

      @if (activeCount() > 0) {
        <div class="filters__active">
          <span class="filters__count">
            {{ activeCount() }} {{ activeCount() === 1 ? 'filter' : 'filters' }} applied
          </span>

          <button type="button" class="btn btn--ghost btn--sm" (click)="clear.emit()">
            Clear all
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  readonly searchValue = input('');
  readonly searchPlaceholder = input('Search');
  readonly activeCount = input(0);

  readonly searchChange = output<string>();
  readonly clear = output<void>();

  onSearch(event: Event): void {
    // Raw value, emitted on every keystroke. Debouncing belongs in the parent,
    // next to the request it throttles — a component that debounces internally
    // is impossible to drive from a test or to flush on submit.
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
