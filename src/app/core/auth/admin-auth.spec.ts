import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';
import { authInterceptor } from './auth.interceptor';

const tokenBody = (token: string) => ({ success: true, data: { accessToken: token, tokenType: 'Bearer', expiresIn: 900 } });
const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('admin auth', () => {
  let auth: AdminAuthService;
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AdminAuthService);
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('shares one refresh request between concurrent callers', () => {
    const tokens: string[] = [];
    auth.refresh().subscribe((t) => tokens.push(t));
    auth.refresh().subscribe((t) => tokens.push(t));
    http.expectOne('/api/admin/auth/refresh').flush(tokenBody('abc'));
    expect(tokens).toEqual(['abc', 'abc']);
  });

  it('sends the token to admin APIs but not to the cookie endpoints', () => {
    auth.refresh().subscribe();
    http.expectOne('/api/admin/auth/refresh').flush(tokenBody('t1'));

    client.get('/api/admin/tenants').subscribe();
    client.post('/api/admin/auth/logout', null).subscribe();
    expect(http.expectOne('/api/admin/tenants').request.headers.get('Authorization')).toBe('Bearer t1');
    expect(http.expectOne('/api/admin/auth/logout').request.headers.has('Authorization')).toBeFalse();
  });

  it('refreshes once on 401, retries, and gives up to sign in when refresh fails', () => {
    auth.refresh().subscribe();
    http.expectOne('/api/admin/auth/refresh').flush(tokenBody('old'));

    let body: unknown;
    client.get('/api/admin/tenants').subscribe((b) => (body = b));
    http.expectOne('/api/admin/tenants').flush(null, unauthorized);
    http.expectOne('/api/admin/auth/refresh').flush(tokenBody('new'));
    const retry = http.expectOne('/api/admin/tenants');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ success: true, data: [] });
    expect(body).toEqual({ success: true, data: [] });

    let failed = false;
    client.get('/api/admin/tenants').subscribe({ error: () => (failed = true) });
    http.expectOne('/api/admin/tenants').flush(null, unauthorized);
    http.expectOne('/api/admin/auth/refresh').flush(null, unauthorized);
    expect(failed).toBeTrue();
    expect(auth.isAuthenticated()).toBeFalse();
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });
});
