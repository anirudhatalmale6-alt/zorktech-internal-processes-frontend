/**
 * Sidebar navigation.
 *
 * Kept as data rather than markup so the menu can later be filtered by role,
 * reordered, or driven from the backend without touching the shell template.
 *
 * PLACEHOLDER SECTIONS — these are a plausible internal-process layout, not
 * Zorktech's. Replace once the screen list is confirmed.
 */
export interface NavItem {
  label: string;
  route: string;
  /** Inline SVG path data, 24x24 viewBox. */
  icon: string;
  /** Empty means visible to everyone signed in. */
  roles?: readonly string[];
  /** Renders a count chip; null hides it. */
  badge?: number | null;
}

export interface NavSection {
  title: string;
  items: readonly NavItem[];
}

const ICONS = {
  dashboard:
    'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5zm0-3v-2h8v2h-8z',
  processes:
    'M4 5h16v2H4V5zm0 6h10v2H4v-2zm0 6h16v2H4v-2zM17 10l4 3-4 3v-6z',
  tasks:
    'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
  reports:
    'M5 21V9h4v12H5zm5 0V3h4v18h-4zm5 0v-7h4v7h-4z',
  catalog:
    'M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z',
  users:
    'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.9 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  settings:
    'M19.4 13a7.8 7.8 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6h-3.8l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.8 7.8 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1c.5.4 1.1.8 1.7 1l.4 2.6h3.8l.4-2.6c.6-.2 1.2-.6 1.7-1l2.5 1 2-3.4L19.4 13zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
} as const;

export const NAVIGATION: readonly NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', route: '/dashboard', icon: ICONS.dashboard }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Processes', route: '/processes', icon: ICONS.processes },
      { label: 'My tasks', route: '/tasks', icon: ICONS.tasks, badge: null },
      { label: 'Reports', route: '/reports', icon: ICONS.reports },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Catalogues', route: '/catalogues', icon: ICONS.catalog, roles: ['ADMIN'] },
      { label: 'Users', route: '/users', icon: ICONS.users, roles: ['ADMIN'] },
      { label: 'Settings', route: '/settings', icon: ICONS.settings, roles: ['ADMIN'] },
    ],
  },
];
