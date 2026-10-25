import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AdminAuthService } from './admin-auth.service';

const API_PREFIX = '/api/admin/';
/** Endpoints that authenticate with the refresh cookie (or credentials) instead of the access token. */
const COOKIE_ENDPOINTS = ['/api/admin/auth/login', '/api/admin/auth/refresh', '/api/admin/auth/logout'];

/**
 * Adds the admin access token to admin API calls. On a 401 it refreshes once and retries; if the refresh
 * fails the session is over and the admin goes back to sign in.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_PREFIX) || COOKIE_ENDPOINTS.includes(req.url)) {
    return next(req);
  }
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  return next(withToken(req, auth.accessToken())).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      return auth.refresh().pipe(
        catchError((refreshErr: unknown) => {
          router.navigateByUrl('/sign-in');
          return throwError(() => refreshErr);
        }),
        switchMap((token) => next(withToken(req, token))),
      );
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
