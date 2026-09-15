import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import { APP_CONFIG } from '../../core/config/app-config';

/**
 * Blocks the app below the minimum supported width.
 *
 * The brief asks for desktop and tablet only, with mobile restricted. This
 * enforces it at the layout level so no screen has to carry a mobile
 * breakpoint, and so a phone user gets a clear explanation instead of a
 * squashed dashboard they will file a bug about.
 *
 * Width is measured, not sniffed from the user agent: a narrow window on a
 * desktop is just as unusable as a phone, and UA sniffing is wrong about new
 * devices by definition.
 */
@Component({
  selector: 'zt-viewport-gate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './viewport-gate.html',
  styleUrl: './viewport-gate.scss',
})
export class ViewportGate {
  private readonly config = inject(APP_CONFIG);

  readonly minWidth = this.config.minViewportWidth;
  readonly currentWidth = signal(window.innerWidth);
  readonly blocked = signal(window.innerWidth < this.config.minViewportWidth);

  constructor() {
    const onResize = () => {
      this.currentWidth.set(window.innerWidth);
      this.blocked.set(window.innerWidth < this.minWidth);
    };

    window.addEventListener('resize', onResize, { passive: true });
    // Rotating a tablet fires orientationchange before resize settles on some
    // browsers; listening to both avoids a gate that stays up after rotating
    // into landscape.
    window.addEventListener('orientationchange', onResize, { passive: true });

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    });
  }
}
