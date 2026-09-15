import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { ToastService } from '../notifications/toast.service';
import { toApiError } from './api-error';

/**
 * Turns every HTTP failure into an {@link ApiError} before it reaches a
 * component, and handles the two cases that are always the same everywhere:
 * an expired session, and a server error nobody is going to handle locally.
 *
 * Validation failures (400/422) are deliberately NOT toasted — they belong
 * next to the offending field, and a toast saying "some fields need attention"
 * on top of red field text is noise.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((response: HttpErrorResponse) => {
      const error = toApiError(response);

      if (error.status === 401) {
        // Don't bounce to /login from the login request itself — that would
        // replace "wrong password" with a redirect loop back to the same form.
        const isLoginAttempt = request.url.includes('auth/login');

        if (!isLoginAttempt) {
          auth.clearSession();

          // Remember where they were so they land back there after signing in.
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
      } else if (error.status === 403) {
        toast.error(error.message);
      } else if (error.status === 0 || error.status >= 500) {
        toast.error(error.message);
      }

      // Always log the raw failure: the normalised message is written for a
      // user, and it hides exactly the detail needed to diagnose the cause.
      console.error(`[http] ${request.method} ${request.urlWithParams} -> ${error.status}`, response);

      return throwError(() => error);
    }),
  );
};
