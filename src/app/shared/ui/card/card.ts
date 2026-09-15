import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Panel container. Content projection has three slots so a card can carry a
 * title row with actions without every caller rebuilding the same header:
 *
 *   <zt-card title="Recent activity">
 *     <button ztCardAction>Export</button>
 *     ...body...
 *     <div ztCardFooter>...</div>
 *   </zt-card>
 */
@Component({
  selector: 'zt-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card" [class.card--flush]="flush()">
      @if (title() || subtitle()) {
        <header class="card__header">
          <div class="card__heading">
            @if (title()) {
              <h2 class="card__title">{{ title() }}</h2>
            }
            @if (subtitle()) {
              <p class="card__subtitle">{{ subtitle() }}</p>
            }
          </div>

          <div class="card__actions">
            <ng-content select="[ztCardAction]" />
          </div>
        </header>
      }

      <div class="card__body">
        <ng-content />
      </div>

      <ng-content select="[ztCardFooter]" />
    </section>
  `,
  styleUrl: './card.scss',
})
export class Card {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');

  /** Removes body padding — for cards whose entire content is a table. */
  readonly flush = input(false);
}
