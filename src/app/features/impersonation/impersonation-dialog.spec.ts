import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tenant, TenantUser } from '../../core/admin/admin.models';
import { ImpersonationDialog } from './impersonation-dialog';

const tenant: Tenant = {
  id: 'p1', name: 'Northwind Labs', slug: 'northwind', ownerUserId: 'u1', ownerName: 'Arun', ownerEmail: 'arun@x.com',
  createdAt: '2026-10-01T00:00:00Z', userCount: 2, activeUserCount: 1, lastActivityAt: null,
};
const user: TenantUser = {
  userId: 'u1', fullName: 'Arun Kumar', email: 'arun@x.com', profile: 'PORTAL_OWNER', active: true,
  lastLoginAt: null, joinedAt: '2026-10-01T00:00:00Z',
};

describe('ImpersonationDialog', () => {
  let fixture: ComponentFixture<ImpersonationDialog>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ImpersonationDialog],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ImpersonationDialog);
    fixture.componentRef.setInput('tenant', tenant);
    el = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  const submit = () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('offers only active users and requires reason, comment and confirmation', () => {
    fixture.detectChanges();
    http.expectOne('/api/admin/tenants/p1/users').flush({
      success: true,
      data: [user, { ...user, userId: 'u2', fullName: 'Karthik', active: false }],
    });
    fixture.detectChanges();

    const options = Array.from(el.querySelectorAll('#impTargetUser option')).map((o) => o.textContent?.trim());
    expect(options).toEqual(['Arun Kumar — arun@x.com']);

    submit();
    expect(el.textContent).toContain('Select a reason.');
    expect(el.textContent).toContain('Add a comment explaining why.');
    expect(el.textContent).toContain('Confirm before continuing.');
    http.expectNone('/api/admin/impersonations');
  });

  it('logs the request and opens the launch link in a new tab', () => {
    const tab = { opener: {}, document: { title: '' }, location: { href: '' }, close: jasmine.createSpy() };
    spyOn(window, 'open').and.returnValue(tab as unknown as Window);
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    const select = (id: string, value: string) => {
      const s = el.querySelector<HTMLSelectElement>(id)!;
      s.value = value;
      s.dispatchEvent(new Event('change'));
    };
    select('#impReason', 'Demo');
    const comment = el.querySelector<HTMLTextAreaElement>('#impComment')!;
    comment.value = 'Walkthrough for the customer';
    comment.dispatchEvent(new Event('input'));
    el.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    submit();

    const req = http.expectOne('/api/admin/impersonations');
    expect(req.request.body).toEqual({
      targetUserId: 'u1', durationMinutes: 15, reason: 'Demo', comment: 'Walkthrough for the customer',
      acknowledged: true, portalId: 'p1',
    });
    expect(tab.opener).toBeNull();
    req.flush({ success: true, data: { id: 'i1', launchUrl: 'http://localhost:4200/impersonate?code=abc', launchExpiresAt: '', expiresAt: '' } });
    expect(tab.location.href).toBe('http://localhost:4200/impersonate?code=abc');
  });
});
