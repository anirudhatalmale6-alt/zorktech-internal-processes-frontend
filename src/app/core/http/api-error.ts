import { HttpErrorResponse } from '@angular/common/http';

/**
 * A backend failure reduced to something the UI can actually render.
 *
 * Components must never touch `HttpErrorResponse` directly: the shape of an
 * error body differs per framework and per gateway, and one component reading
 * `error.error.message` while another reads `error.error.detail` is how a
 * "something went wrong" placeholder ends up shipped. Normalise once, here.
 */
export interface ApiError {
  /** HTTP status. 0 means the request never reached the server. */
  status: number;

  /** Safe to show a user. Never contains a stack trace or SQL. */
  message: string;

  /** Machine-readable code from the backend, when it sends one. */
  code?: string;

  /** Field-level validation messages, keyed by form control name. */
  fieldErrors?: Record<string, string[]>;

  /** True when retrying the same request could plausibly succeed. */
  retryable: boolean;

  /** Raw response, kept for logging. Not for display. */
  raw: unknown;
}

const NETWORK_MESSAGE =
  'Could not reach the server. Check your connection and try again.';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Status codes worth retrying. 408/429 and the 5xx family are transient;
 * a 400 or a 422 will fail identically no matter how many times it is sent.
 */
const RETRYABLE_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504]);

/**
 * Pulls a human-readable message out of whatever the backend returned.
 *
 * Covers the shapes seen in practice: `{message}`, `{error}`, `{detail}` (the
 * FastAPI/DRF convention), `{title}` (RFC 7807 problem+json), and a bare
 * string body. Returns null when nothing usable is present, so the caller can
 * fall back rather than displaying "[object Object]" — which is what naive
 * `String(error.error)` produces and it does reach users.
 */
function extractMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();

    // An HTML error page from a proxy is not a message. Showing the first line
    // of a 502 page to a user is worse than showing nothing.
    if (!trimmed || trimmed.startsWith('<')) {
      return null;
    }

    return trimmed;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;

  for (const key of ['message', 'error', 'detail', 'title', 'error_description']) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Normalises validation errors into `{ fieldName: [messages] }`.
 *
 * Accepts both `{errors: {email: ['required']}}` and the single-string variant
 * `{errors: {email: 'required'}}`, because backends emit both.
 */
function extractFieldErrors(body: unknown): Record<string, string[]> | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const candidate = record['errors'] ?? record['fieldErrors'] ?? record['validation'];

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return undefined;
  }

  const result: Record<string, string[]> = {};

  for (const [field, value] of Object.entries(candidate as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[field] = [value];
    } else if (Array.isArray(value)) {
      const messages = value.filter((item): item is string => typeof item === 'string');

      if (messages.length) {
        result[field] = messages;
      }
    }
  }

  return Object.keys(result).length ? result : undefined;
}

/** Default wording per status, used only when the backend sends nothing usable. */
function messageForStatus(status: number): string {
  switch (status) {
    case 0:
      return NETWORK_MESSAGE;
    case 400:
      return 'The request was rejected. Please check the values and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'That record no longer exists.';
    case 409:
      return 'Someone else changed this record. Reload and try again.';
    case 422:
      return 'Some fields need attention.';
    case 429:
      return 'Too many requests. Wait a moment and try again.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Try again shortly.';
    default:
      return status >= 500 ? 'The server hit an error handling that request.' : GENERIC_MESSAGE;
  }
}

export function toApiError(response: HttpErrorResponse): ApiError {
  // status 0 with an ErrorEvent means the browser never got a response at all:
  // DNS failure, CORS rejection, offline, or the request was aborted.
  const status = response.status ?? 0;
  const body = response.error;

  return {
    status,
    message: extractMessage(body) ?? messageForStatus(status),
    code: typeof (body as Record<string, unknown>)?.['code'] === 'string'
      ? ((body as Record<string, unknown>)['code'] as string)
      : undefined,
    fieldErrors: extractFieldErrors(body),
    retryable: RETRYABLE_STATUSES.has(status),
    raw: body,
  };
}

/** Type guard so `catchError` handlers can tell a normalised error from anything else. */
export function isApiError(value: unknown): value is ApiError {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as ApiError).status === 'number' &&
    typeof (value as ApiError).message === 'string' &&
    'retryable' in value
  );
}
