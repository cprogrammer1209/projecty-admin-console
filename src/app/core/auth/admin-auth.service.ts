import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { unwrap } from '../api/api-error';
import { AppResponse } from '../api/api.types';

interface AccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Admin {
  id: string;
  email: string;
  fullName: string;
}

/**
 * The admin console session. The access token lives only in memory; the refresh token is the HttpOnly
 * `py_admin_refresh` cookie, separate from the customer app's cookie.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);

  private readonly token = signal<string | null>(null);
  private readonly currentAdmin = signal<Admin | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly accessToken = this.token.asReadonly();
  readonly admin = this.currentAdmin.asReadonly();
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(email: string, password: string): Observable<Admin> {
    return this.http
      .post<AppResponse<AccessTokenResponse>>('/api/admin/auth/login', { email, password })
      .pipe(
        unwrap(),
        tap((res) => this.token.set(res.accessToken)),
        switchMap(() => this.loadMe()),
      );
  }

  /** Concurrent callers share one request, since each refresh replaces the cookie. */
  refresh(): Observable<string> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<AppResponse<AccessTokenResponse>>('/api/admin/auth/refresh', null)
        .pipe(
          unwrap(),
          map((res) => res.accessToken),
          tap({
            next: (accessToken) => this.token.set(accessToken),
            error: () => this.clear(),
          }),
          finalize(() => (this.refreshInFlight = null)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight;
  }

  loadMe(): Observable<Admin> {
    return this.http.get<AppResponse<Admin>>('/api/admin/auth/me').pipe(
      unwrap(),
      tap((admin) => this.currentAdmin.set(admin)),
    );
  }

  /** Called once on app start: a valid refresh cookie silently signs the admin back in. */
  restoreSession(): Promise<void> {
    return firstValueFrom(
      this.refresh().pipe(
        switchMap(() => this.loadMe()),
        map(() => undefined),
        catchError(() => of(undefined)),
      ),
    );
  }

  logout(): Observable<void> {
    return this.http.post<AppResponse<void>>('/api/admin/auth/logout', null).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.clear()),
    );
  }

  clear(): void {
    this.token.set(null);
    this.currentAdmin.set(null);
  }
}
