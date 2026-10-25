import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AdminApi } from '../../core/admin/admin.api';
import { Tenant } from '../../core/admin/admin.models';
import { SearchService } from '../../shared/search.service';
import { initials, matches } from '../../shared/text';
import { Icon } from '../../shared/ui/icon';
import { ImpersonationDialog } from '../impersonation/impersonation-dialog';

@Component({
  selector: 'pa-tenant-list',
  imports: [DatePipe, RouterLink, Icon, ImpersonationDialog],
  templateUrl: './tenant-list.html',
})
export class TenantList {
  private readonly api = inject(AdminApi);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);

  protected readonly loadFailed = signal(false);
  protected readonly tenants = toSignal(
    this.api.tenants().pipe(
      catchError(() => {
        this.loadFailed.set(true);
        return of([] as Tenant[]);
      }),
    ),
  );
  protected readonly visible = computed(() =>
    (this.tenants() ?? []).filter((t) =>
      matches(this.search.query(), t.name, t.slug, t.id, t.ownerName, t.ownerEmail),
    ),
  );
  protected readonly totalUsers = computed(() =>
    (this.tenants() ?? []).reduce((sum, t) => sum + t.userCount, 0),
  );
  protected readonly activeUsers = computed(() =>
    (this.tenants() ?? []).reduce((sum, t) => sum + t.activeUserCount, 0),
  );

  /** The tenant whose "sign in as" dialog is open. */
  protected readonly impersonating = signal<Tenant | null>(null);
  protected readonly initials = initials;

  protected open(tenant: Tenant): void {
    this.router.navigate(['/tenants', tenant.id]);
  }
}
