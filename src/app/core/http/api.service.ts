import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';

/** Query parameters as callers naturally write them. */
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number>
>;

/**
 * Thin typed wrapper over HttpClient.
 *
 * Its only jobs are joining the runtime base URL to a path and turning a plain
 * object into HttpParams. Auth headers and error normalisation are handled by
 * interceptors, so they apply to every request — including ones made by code
 * that bypasses this service.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: toHttpParams(params) });
  }

  post<T>(path: string, body?: unknown, params?: QueryParams): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? {}, { params: toHttpParams(params) });
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body ?? {});
  }

  delete<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.delete<T>(this.url(path), { params: toHttpParams(params) });
  }

  /**
   * File download. Returns the raw Blob so the caller decides whether to save
   * it or preview it — `responseType: 'blob'` also stops HttpClient trying to
   * JSON.parse a PDF, which throws in a way that looks like a network error.
   */
  download(path: string, params?: QueryParams): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: toHttpParams(params),
      responseType: 'blob',
    });
  }

  upload<T>(path: string, form: FormData): Observable<T> {
    // No explicit Content-Type: the browser must set it so the multipart
    // boundary is included. Setting it by hand produces a body the server
    // cannot parse, and the resulting 400 is baffling to debug.
    return this.http.post<T>(this.url(path), form);
  }

  /** Joins the runtime base URL to a path, tolerating a leading slash or not. */
  private url(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.config.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
  }
}

/**
 * Builds HttpParams, dropping null/undefined.
 *
 * Dropping them matters: `HttpParams` stringifies `undefined` to the literal
 * text "undefined", so an unset filter silently becomes `?status=undefined`
 * and the backend either 400s or — worse — matches nothing and the screen
 * renders a convincing empty table.
 */
export function toHttpParams(params?: QueryParams): HttpParams {
  let httpParams = new HttpParams();

  if (!params) {
    return httpParams;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        httpParams = httpParams.append(key, String(item));
      }
    } else {
      httpParams = httpParams.set(key, String(value));
    }
  }

  return httpParams;
}
