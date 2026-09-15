import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Title block at the top of every screen, with an optional actions slot. */
@Component({
  selector: 'zt-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__heading">
        @if (eyebrow()) {
          <p class="page-header__eyebrow">{{ eyebrow() }}</p>
        }

        <h1 class="page-header__title">{{ title() }}</h1>

        @if (description()) {
          <p class="page-header__description">{{ description() }}</p>
        }
      </div>

      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    @use '../../../../styles/typography' as type;

    :host {
      display: block;
      margin-bottom: var(--space-6);
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-6);
    }

    .page-header__heading {
      min-width: 0;
    }

    .page-header__eyebrow {
      @include type.eyebrow;

      margin-bottom: var(--space-2);
    }

    .page-header__title {
      @include type.page-title;
    }

    .page-header__description {
      @include type.body-secondary;

      max-width: 60ch; // long help text stops being readable past this
      margin-top: var(--space-2);
    }

    .page-header__actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly description = input<string>('');
}
