import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_CONFIG } from '../../core/config/app-config';
import { AuthService } from '../../core/auth/auth.service';
import { NAVIGATION, NavSection } from '../navigation';
import { Sidebar } from '../sidebar/sidebar';

const SIDEBAR_KEY = 'zt.sidebar_collapsed';

/**
 * Application shell: sidebar, topbar, routed content.
 *
 * Every authenticated screen renders inside this, so page-level components
 * never repeat chrome and stay focused on their own content.
 */
@Component({
  selector: 'zt-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly config = inject(APP_CONFIG);

  readonly collapsed = signal(readCollapsed());
  readonly userMenuOpen = signal(false);

  readonly displayName = this.auth.displayName;
  readonly initials = this.auth.initials;
  readonly environmentLabel = this.config.environmentLabel;
  readonly showRibbon = this.config.showEnvironmentRibbon;

  /**
   * Sections filtered to what this user may see, with empty sections dropped.
   *
   * Without the empty-section drop, an operator sees a bare "Administration"
   * heading with nothing under it — which reads as a broken menu rather than
   * as a permission boundary.
   */
  readonly sections = computed<readonly NavSection[]>(() => {
    // Touch the user signal so the menu recomputes on sign-in/out.
    this.auth.user();

    return NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter((item) => this.auth.hasAnyRole(item.roles ?? [])),
    })).filter((section) => section.items.length > 0);
  });

  toggleSidebar(): void {
    this.collapsed.update((value) => {
      const next = !value;

      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        // A locked-down browser profile just means the preference doesn't
        // survive a reload. Not worth surfacing to the user.
      }

      return next;
    });
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.auth.logout();
  }
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  } catch {
    return false;
  }
}
