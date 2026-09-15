import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Blocks routes for signed-out users and remembers where they were headed.
 *
 * A guard is a routing convenience, not a security boundary — anyone can open
 * devtools and flip a signal. Every endpoint behind these screens must check
 * permissions server-side.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Role-gated routes. Usage:
 *   { path: 'admin', canActivate: [authGuard, roleGuard(['ADMIN'])], ... }
 *
 * Sends an authenticated-but-unauthorised user to a "no access" screen rather
 * than to /login — bouncing someone to a login form they are already past is
 * the kind of dead end that generates support tickets.
 */
export function roleGuard(roles: readonly string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.hasAnyRole(roles) ? true : router.createUrlTree(['/forbidden']);
  };
}
