import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

/**
 * Every feature route is lazy-loaded.
 *
 * Doing this from the start rather than "later, once it's slow" matters: an
 * internal tool grows a long tail of admin screens that most users never open,
 * and eagerly bundling them makes everyone pay the download for screens they
 * have no permission to see.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Zorktech',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Zorktech',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'processes',
        title: 'Processes · Zorktech',
        loadComponent: () =>
          import('./features/processes/processes-list').then((m) => m.ProcessesList),
      },
      {
        // `:id` binds to the component's `id` input via withComponentInputBinding().
        path: 'processes/:id',
        title: 'Process · Zorktech',
        loadComponent: () =>
          import('./features/processes/process-detail').then((m) => m.ProcessDetail),
      },
      {
        path: 'forbidden',
        title: 'No access · Zorktech',
        loadComponent: () => import('./features/errors/forbidden').then((m) => m.Forbidden),
      },

      // Screens still to be built. Each gets its own route as it lands; until
      // then they resolve to the 404 page below rather than a dead link that
      // silently does nothing when clicked.

      {
        path: '**',
        title: 'Not found · Zorktech',
        loadComponent: () => import('./features/errors/not-found').then((m) => m.NotFound),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
