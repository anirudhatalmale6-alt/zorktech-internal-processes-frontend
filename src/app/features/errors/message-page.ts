import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Shared layout for the standalone message screens (404, 403).
 *
 * One component with inputs rather than two near-identical ones — they differ
 * only in wording, and duplicating the markup guarantees they drift apart the
 * first time either is restyled.
 */
@Component({
  selector: 'zt-message-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="message">
      <p class="message__code">{{ code() }}</p>
      <h1 class="message__title">{{ title() }}</h1>
      <p class="message__body">{{ description() }}</p>

      <a class="btn btn--primary" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styles: `
    @use '../../../styles/typography' as type;

    .message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60dvh;
      padding: var(--space-8);
      text-align: center;
    }

    .message__code {
      @include type.numeric;

      font-family: var(--font-display);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-disabled);
    }

    .message__title {
      @include type.section-title;

      margin-top: var(--space-3);
    }

    .message__body {
      @include type.body-secondary;

      max-width: 44ch;
      margin: var(--space-3) 0 var(--space-6);
    }
  `,
})
export class MessagePage {
  readonly code = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
