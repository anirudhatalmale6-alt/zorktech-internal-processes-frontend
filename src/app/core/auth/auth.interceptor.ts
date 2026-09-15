import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { APP_CONFIG } from '../config/app-config';
import { AuthService } from './auth.service';

/**
 * Attaches the bearer token to Zorktech API calls, and to nothing else.
 *
 * The rule is "does this request go to the configured API base URL", NOT "is
 * this request same-origin". Those are different questions: the API may well
 * be served from `https://api.zorktech.example` while the app is on
 * `https://internal.zorktech.example`, and a same-origin test would quietly
 * strip the token from every single call — producing a 401 on every screen
 * with nothing in the code obviously wrong. Equally, a same-origin test would
 * happily attach the token to a request to some unrelated same-origin asset.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const config = inject(APP_CONFIG);
  const token = auth.getToken();

  if (!token || !targetsApi(request.url, config.apiBaseUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};

/**
 * True when `url` is under `apiBaseUrl`.
 *
 * Both are resolved against the document origin first, so a relative base like
 * `/api` and an absolute one like `https://api.example.com` are compared the
 * same way. The trailing-slash guard stops `/api` from matching `/apiary`.
 */
function targetsApi(url: string, apiBaseUrl: string): boolean {
  try {
    const target = new URL(url, window.location.origin);
    const base = new URL(apiBaseUrl, window.location.origin);

    if (target.origin !== base.origin) {
      return false;
    }

    const basePath = base.pathname.replace(/\/+$/, '');

    // An empty base path means the whole origin is the API.
    if (!basePath) {
      return true;
    }

    return target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
  } catch {
    // An unparseable URL is not something to guess about — send it untouched.
    return false;
  }
}
