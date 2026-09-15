import { InjectionToken, inject, provideAppInitializer } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Runtime configuration.
 *
 * Deliberately loaded from `/config.json` at boot rather than compiled in via
 * `environment.ts`. One artefact is then promoted unchanged from dev to staging
 * to production, and pointing the frontend at a different backend is an edit to
 * a text file on the server — no rebuild, no risk of shipping a build that
 * still talks to staging.
 */
export interface AppConfig {
  /** Base URL of the Zorktech API, no trailing slash. e.g. https://api.zorktech.example */
  apiBaseUrl: string;

  /** Shown in the topbar so nobody mistakes staging for production. */
  environmentLabel: string;

  /** Hide the environment ribbon in production. */
  showEnvironmentRibbon: boolean;

  /** Minimum viewport width, in px, below which the app refuses to render. */
  minViewportWidth: number;

  /**
   * Seconds before token expiry at which a silent refresh is attempted.
   * Ignored until the auth scheme is confirmed with the backend team.
   */
  tokenRefreshLeewaySeconds: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: '/api',
  environmentLabel: 'local',
  showEnvironmentRibbon: true,
  minViewportWidth: 900,
  tokenRefreshLeewaySeconds: 60,
};

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

/**
 * Mutable holder written once during bootstrap. Interceptors and services read
 * through {@link APP_CONFIG}, never from this object directly.
 */
const loadedConfig: AppConfig = { ...DEFAULT_CONFIG };

/**
 * Fetches `/config.json` before the app renders.
 *
 * A missing or malformed file is a deployment mistake, not something to paper
 * over: we log loudly and fall back to defaults so the app still boots and the
 * developer sees why every request is going to the wrong place. Silently
 * defaulting to `/api` with no warning is how a frontend ends up pointed at
 * nothing for a day before anyone notices.
 */
export function provideRuntimeConfig() {
  return [
    { provide: APP_CONFIG, useValue: loadedConfig },
    provideAppInitializer(async () => {
      const http = inject(HttpClient);

      try {
        const fetched = await firstValueFrom(
          // Cache-bust: a stale config.json served from a CDN edge is the exact
          // failure this whole approach is meant to avoid.
          http.get<Partial<AppConfig>>('config.json', {
            headers: { 'Cache-Control': 'no-cache' },
          }),
        );

        if (!fetched?.apiBaseUrl) {
          console.error(
            '[config] config.json loaded but has no apiBaseUrl. Falling back to defaults.',
            fetched,
          );
        }

        Object.assign(loadedConfig, fetched);

        // Normalise: a trailing slash here plus a leading slash on every path
        // produces `//endpoint`, which some gateways 404 on.
        loadedConfig.apiBaseUrl = loadedConfig.apiBaseUrl.replace(/\/+$/, '');
      } catch (error) {
        console.error(
          '[config] Could not load config.json — the app is running on built-in ' +
            'defaults and will talk to ' + DEFAULT_CONFIG.apiBaseUrl,
          error,
        );
      }
    }),
  ];
}
