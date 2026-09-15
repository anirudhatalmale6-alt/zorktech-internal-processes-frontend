import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from '../http/api.service';
import { AuthenticatedUser, LoginRequest, LoginResponse } from './auth.models';

const TOKEN_KEY = 'zt.access_token';
const USER_KEY = 'zt.user';

/**
 * Session state for the app.
 *
 * Storage note — `sessionStorage`, not `localStorage`: these are shared office
 * desktops by the sound of the brief, and sessionStorage dies with the tab
 * rather than leaving a valid token behind for whoever sits down next. If the
 * backend turns out to issue an httpOnly cookie instead, the token handling
 * here disappears entirely and `isAuthenticated` becomes a `/me` probe — the
 * rest of the app is unaffected because nothing else reads the token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(readStoredToken());
  private readonly currentUser = signal<AuthenticatedUser | null>(readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly displayName = computed(() => this.currentUser()?.displayName ?? 'Signed in');

  /** Initials for the avatar chip, e.g. "Ana Lopez" -> "AL". */
  readonly initials = computed(() => {
    const name = this.currentUser()?.displayName?.trim();

    if (!name) {
      return '?';
    }

    const parts = name.split(/\s+/);

    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Endpoint path is provisional — confirm against Swagger.
    return this.api
      .post<LoginResponse>('auth/login', credentials)
      .pipe(tap((response) => this.acceptSession(response)));
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  /**
   * Menu/route visibility only. Never treat a false here as a security
   * boundary — see the note on {@link AuthenticatedUser.roles}.
   */
  hasAnyRole(roles: readonly string[]): boolean {
    if (!roles.length) {
      return true;
    }

    const held = this.currentUser()?.roles ?? [];

    return roles.some((role) => held.includes(role));
  }

  private acceptSession(response: LoginResponse): void {
    if (!response?.accessToken) {
      // Defensive: a 200 with no token means the contract changed. Failing
      // loudly here beats a "successful" login that leaves every subsequent
      // request unauthenticated and 401-ing with no obvious cause.
      throw new Error('Login succeeded but returned no access token.');
    }

    this.token.set(response.accessToken);
    sessionStorage.setItem(TOKEN_KEY, response.accessToken);

    if (response.user) {
      this.currentUser.set(response.user);
      sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
  }

  /** Drops local session state without navigating. Used by the 401 handler. */
  clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Storage can throw in hardened browser profiles. An unreadable store just
    // means "not signed in" rather than a crash on boot.
    return null;
  }
}

function readStoredUser(): AuthenticatedUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);

    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}
