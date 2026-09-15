/**
 * Auth contract — PROVISIONAL.
 *
 * These interfaces are written against the most common shape for a JWT login
 * endpoint. They are the first thing to reconcile against the real Swagger
 * document; the rest of the app only ever touches `AuthService`, so correcting
 * them is a change to this file plus `AuthService`, not a change to features.
 */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  /** Seconds until `accessToken` expires. */
  expiresIn?: number;
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  /**
   * Roles as the backend names them.
   *
   * These drive which menu items render — a convenience, not a security
   * control. The backend must enforce the same rules on every endpoint,
   * because anything the browser decides can be edited by the person using it.
   */
  roles: string[];
}
