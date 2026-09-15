import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastHost } from './shared/ui/toast-host/toast-host';
import { ViewportGate } from './layout/viewport-gate/viewport-gate';

/**
 * Root component. Deliberately thin: the routed shell owns all chrome, so this
 * only mounts the two things that must exist above the router — the viewport
 * gate and the toast stack.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastHost, ViewportGate],
  template: `
    <zt-viewport-gate />
    <router-outlet />
    <zt-toast-host />
  `,
})
export class App {}
