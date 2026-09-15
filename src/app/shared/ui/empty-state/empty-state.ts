import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder for "no rows".
 *
 * Takes a `filtered` flag because "nothing here yet" and "nothing matches your
 * filters" need different wording and different next steps — showing the first
 * when the second is true sends people looking for a data problem that is
 * really an un-cleared filter.
 */
@Component({
  selector: 'zt-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <svg class="empty__icon" viewBox="0 0 24 24" aria-hidden="true">
        @if (filtered()) {
          <path
            fill="currentColor"
            d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
          />
        } @else {
          <path
            fill="currentColor"
            d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V5h14v14zM7 12h10v2H7v-2zm0-4h10v2H7V8z"
          />
        }
      </svg>

      <p class="empty__title">{{ title() }}</p>

      @if (description()) {
        <p class="empty__description">{{ description() }}</p>
      }

      <div class="empty__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    @use '../../../../styles/typography' as type;

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-6);
      text-align: center;
    }

    .empty__icon {
      width: 2.25rem;
      height: 2.25rem;
      margin-bottom: var(--space-4);
      color: var(--text-disabled);
    }

    .empty__title {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .empty__description {
      @include type.body-secondary;

      max-width: 44ch;
      margin-top: var(--space-2);
    }

    .empty__actions:not(:empty) {
      margin-top: var(--space-5);
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>('');

  /** True when filters are active, so the copy points at the filters. */
  readonly filtered = input(false);
}
