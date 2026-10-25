import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdminApi } from '../../core/admin/admin.api';
import { AuditEvent, Tenant, TenantUser } from '../../core/admin/admin.models';
import { ApiError } from '../../core/api/api.types';
import { SearchService } from '../../shared/search.service';
import { initials, matches, profileLabel } from '../../shared/text';
import { AuditLogList } from '../../shared/ui/audit-log-list';
import { Icon } from '../../shared/ui/icon';
import { ImpersonationDialog } from '../impersonation/impersonation-dialog';

type Tab = 'details' | 'users' | 'permissions' | 'activity';
const TABS: Tab[] = ['details', 'users', 'permissions', 'activity'];

@Component({
  selector: 'pa-tenant-detail',
  imports: [DatePipe, RouterLink, Icon, AuditLogList, ImpersonationDialog],
  templateUrl: './tenant-detail.html',
})
export class TenantDetail implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);

  /** Route parameter and query string (withComponentInputBinding). */
  readonly id = input.required<string>();
  readonly tab = input<string>();

  protected readonly activeTab = computed<Tab>(() => (TABS.includes(this.tab() as Tab) ? (this.tab() as Tab) : 'details'));
  protected readonly tenant = signal<Tenant | null>(null);
  protected readonly users = signal<TenantUser[] | null>(null);
  protected readonly events = signal<AuditEvent[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly userQuery = signal('');
  protected readonly impersonating = signal<TenantUser | null>(null);

  protected readonly visibleUsers = computed(() => {
    const query = this.userQuery() || this.search.query();
    return (this.users() ?? []).filter((u) => matches(query, u.fullName, u.email, profileLabel(u.profile)));
  });
  protected readonly activeCount = computed(() => (this.users() ?? []).filter((u) => u.active).length);

  protected readonly initials = initials;
  protected readonly profileLabel = profileLabel;

  ngOnInit(): void {
    this.api.tenant(this.id()).subscribe({
      next: (tenant) => this.tenant.set(tenant),
      error: (err: ApiError) => this.error.set(err.message),
    });
    this.api.tenantUsers(this.id()).subscribe({ next: (users) => this.users.set(users), error: () => this.users.set([]) });
    this.loadActivity();
  }

  protected loadActivity(): void {
    this.api.auditEvents(this.id()).subscribe({ next: (events) => this.events.set(events), error: () => this.events.set([]) });
  }

  protected select(tab: Tab): void {
    if (tab === 'activity') {
      this.loadActivity();
    }
    this.router.navigate([], { queryParams: { tab: tab === 'details' ? null : tab }, replaceUrl: true });
  }

  protected onUserSearch(event: Event): void {
    this.userQuery.set((event.target as HTMLInputElement).value);
  }
}
