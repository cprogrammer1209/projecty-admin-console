import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { AdminApi } from '../../core/admin/admin.api';
import { AuditEvent, Tenant } from '../../core/admin/admin.models';
import { SearchService } from '../../shared/search.service';
import { matches } from '../../shared/text';
import { AuditLogList, describeAuditEvent } from '../../shared/ui/audit-log-list';

/** Platform audit logs: administrative and support activity across all tenants (newest 200). */
@Component({
  selector: 'pa-audit-log',
  imports: [AuditLogList],
  template: `
    <section>
      <div class="head">
        <div>
          <div class="eyebrow">PLATFORM / SECURITY</div>
          <h1>Platform audit logs</h1>
          <p>Administrative activity across all tenants.</p>
        </div>
      </div>
      <section class="panel">
        <div class="panel-head">
          <h2>Recent platform activity</h2>
          <label class="search" style="width: 220px">
            <input placeholder="Filter audit logs..." aria-label="Filter audit logs" (input)="filter.set($any($event.target).value)" />
          </label>
        </div>
        @if (events(); as list) {
          <pa-audit-log-list [events]="visible()" [tenantNames]="tenantNames()" emptyText="No matching audit events." />
        } @else {
          <div class="loading">Loading audit events…</div>
        }
      </section>
    </section>
  `,
})
export class AuditLog {
  private readonly api = inject(AdminApi);
  private readonly search = inject(SearchService);

  protected readonly filter = signal('');
  protected readonly events = toSignal(this.api.auditEvents().pipe(catchError(() => of([] as AuditEvent[]))));
  private readonly tenants = toSignal(this.api.tenants().pipe(catchError(() => of([] as Tenant[]))));

  protected readonly tenantNames = computed(
    () => new Map((this.tenants() ?? []).map((t) => [t.id, t.name] as [string, string])),
  );
  protected readonly visible = computed(() => {
    const query = this.filter() || this.search.query();
    const names = this.tenantNames();
    return (this.events() ?? []).filter((e) =>
      matches(query, e.actorName, describeAuditEvent(e), e.detail, e.portalId ? names.get(e.portalId) : null),
    );
  });
}
