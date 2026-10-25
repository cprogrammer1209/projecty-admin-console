import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminApi } from '../../core/admin/admin.api';
import { ImpersonationStart, Tenant, TenantUser } from '../../core/admin/admin.models';
import { ApiError } from '../../core/api/api.types';
import { initials } from '../../shared/text';
import { ToastService } from '../../shared/ui/toast';

export const DURATIONS = [
  { minutes: 15, label: '15 mins' },
  { minutes: 60, label: '60 mins' },
  { minutes: 240, label: '4 hrs' },
  { minutes: 720, label: '12 hrs' },
  { minutes: 1440, label: '24 hrs' },
];
export const REASONS = ['Account setup', 'Demo', 'Configuration', 'Testing'];
const COMMENT_MAX = 1000;

/**
 * "Start impersonation": records why, for how long and as whom, then opens the customer app in a new tab
 * signed in as that user.
 */
@Component({
  selector: 'pa-impersonation-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './impersonation-dialog.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class ImpersonationDialog implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  readonly tenant = input.required<Tenant>();
  /** Preselected user (from the users tab); otherwise the dialog offers a picker. */
  readonly user = input<TenantUser | null>(null);
  readonly closed = output<void>();
  /** Emitted after the request was logged, so the caller can refresh its activity list. */
  readonly started = output<ImpersonationStart>();

  protected readonly durations = DURATIONS;
  protected readonly reasons = REASONS;
  protected readonly users = signal<TenantUser[] | null>(null);
  protected readonly activeUsers = computed(() => (this.users() ?? []).filter((u) => u.active));
  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Set when the browser blocked the new tab: the admin opens the link themselves. */
  protected readonly blockedLaunchUrl = signal<string | null>(null);
  protected readonly initials = initials;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    targetUserId: ['', Validators.required],
    durationMinutes: [15, Validators.required],
    reason: ['', Validators.required],
    comment: ['', [Validators.required, Validators.maxLength(COMMENT_MAX)]],
    acknowledged: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    const preselected = this.user();
    if (preselected) {
      this.form.controls.targetUserId.setValue(preselected.userId);
      return;
    }
    this.api.tenantUsers(this.tenant().id).subscribe({
      next: (users) => {
        this.users.set(users);
        const first = users.find((u) => u.active);
        if (first) {
          this.form.controls.targetUserId.setValue(first.userId);
        }
      },
      error: (err: ApiError) => this.error.set(err.message),
    });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected close(): void {
    if (!this.busy()) {
      this.closed.emit();
    }
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      return;
    }
    // Open the tab now, while the click still counts as a user action; popup blockers allow that.
    const tab = window.open('', '_blank');
    if (tab) {
      tab.opener = null;
      tab.document.title = 'Starting support session…';
    }
    const value = this.form.getRawValue();
    this.busy.set(true);
    this.api
      .startImpersonation({ ...value, portalId: this.tenant().id, comment: value.comment.trim() })
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.started.emit(result);
          if (tab) {
            tab.location.href = result.launchUrl;
            this.toast.show('Impersonation logged. The support session opened in a new tab.');
            this.closed.emit();
          } else {
            this.blockedLaunchUrl.set(result.launchUrl);
          }
        },
        error: (err: ApiError) => {
          tab?.close();
          this.busy.set(false);
          this.error.set(err.message);
        },
      });
  }
}
