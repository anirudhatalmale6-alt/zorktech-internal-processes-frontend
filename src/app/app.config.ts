import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { provideRuntimeConfig } from './core/config/app-config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      // Bind route params straight to component inputs — removes a pile of
      // ActivatedRoute boilerplate from every detail screen.
      withComponentInputBinding(),
      // Without this, navigating from row 400 of a long list into a detail
      // screen opens it scrolled to the middle, which reads as a broken page.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),

    provideHttpClient(
      withFetch(),
      // Order matters: auth runs first so the token is attached before the
      // error interceptor gets a chance to see a 401 and clear the session.
      withInterceptors([authInterceptor, errorInterceptor]),
    ),

    provideRuntimeConfig(),
  ],
};
