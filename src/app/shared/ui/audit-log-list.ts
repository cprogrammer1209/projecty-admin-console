import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AuditEvent } from '../../core/admin/admin.models';

const ACTION_TEXT: Record<string, (e: AuditEvent) => string> = {
  ADMIN_SIGNED_IN: () => 'signed in to the admin console',
  IMPERSONATION_REQUESTED: (e) => `requested impersonation of ${e.targetName ?? 'a user'}`,
  IMPERSONATION_STARTED: (e) => `signed in as ${e.targetName ?? 'a user'}`,
  IMPERSONATION_ENDED: (e) => `ended the support session as ${e.targetName ?? 'a user'}`,
};

/** "requested impersonation of Arun Kumar", without the actor. */
export function describeAuditEvent(event: AuditEvent): string {
  return ACTION_TEXT[event.action]?.(event) ?? event.action.toLowerCase().replace(/_/g, ' ');
}

/** Audit events as the prototype's log rows. `tenantNames` adds "in {tenant}" on the platform view. */
@Component({
  selector: 'pa-audit-log-list',
  imports: [DatePipe],
  template: `
    @for (event of events(); track event.id) {
      <div class="log">
        <span class="log-icon" aria-hidden="true">↻</span>
        <div class="log-copy">
          <strong>{{ event.actorName }}</strong> {{ describe(event) }}
          @if (tenantName(event); as tenant) {
            <span style="color: var(--py-ink-muted)">in {{ tenant }}</span>
          }
          <small>
            @if (event.detail) { {{ event.detail }} · }
            {{ event.occurredAt | date: 'medium' }}
          </small>
        </div>
        <span class="badge">{{ category(event) }}</span>
      </div>
    } @empty {
      <div class="empty">{{ emptyText() }}</div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogList {
  readonly events = input.required<AuditEvent[]>();
  readonly tenantNames = input<Map<string, string> | null>(null);
  readonly emptyText = input('No audit events yet.');

  protected readonly describe = describeAuditEvent;

  protected tenantName(event: AuditEvent): string | null {
    return event.portalId ? (this.tenantNames()?.get(event.portalId) ?? null) : null;
  }

  protected category(event: AuditEvent): string {
    return event.category.charAt(0) + event.category.slice(1).toLowerCase();
  }
}
