import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavSection } from '../navigation';

/**
 * Sidebar navigation rail.
 *
 * Split out of the shell rather than living inside it: the rail carries its
 * own collapsed/expanded behaviour and its own tablet rules, which together
 * are most of the chrome's CSS. Keeping it here means the shell file stays
 * readable, and the rail can be exercised on its own.
 *
 * `collapsed` is an input rather than internal state so the shell stays the
 * single owner of the layout width — two components independently deciding
 * whether the rail is collapsed is how the grid column and the rail contents
 * end up disagreeing.
 */
@Component({
  selector: 'zt-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '[class.sidebar--collapsed]': 'collapsed()',
  },
})
export class Sidebar {
  readonly sections = input.required<readonly NavSection[]>();
  readonly collapsed = input(false);

  readonly toggle = output<void>();
}
