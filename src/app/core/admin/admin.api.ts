import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { unwrap } from '../api/api-error';
import { AppResponse } from '../api/api.types';
import { AuditEvent, ImpersonationRequest, ImpersonationStart, Tenant, TenantUser } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  tenants(): Observable<Tenant[]> {
    return this.http.get<AppResponse<Tenant[]>>('/api/admin/tenants').pipe(unwrap());
  }

  tenant(id: string): Observable<Tenant> {
    return this.http.get<AppResponse<Tenant>>(`/api/admin/tenants/${id}`).pipe(unwrap());
  }

  tenantUsers(id: string): Observable<TenantUser[]> {
    return this.http.get<AppResponse<TenantUser[]>>(`/api/admin/tenants/${id}/users`).pipe(unwrap());
  }

  /** Newest first; all tenants, or one when `portalId` is given. */
  auditEvents(portalId?: string): Observable<AuditEvent[]> {
    const params: Record<string, string> = portalId ? { portalId } : {};
    return this.http.get<AppResponse<AuditEvent[]>>('/api/admin/audit-events', { params }).pipe(unwrap());
  }

  startImpersonation(request: ImpersonationRequest): Observable<ImpersonationStart> {
    return this.http
      .post<AppResponse<ImpersonationStart>>('/api/admin/impersonations', request)
      .pipe(unwrap());
  }
}
