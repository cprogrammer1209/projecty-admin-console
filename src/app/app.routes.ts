import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guards';
import { Shell } from './features/shell/shell';

const TITLE_SUFFIX = ' · ProjectY Admin';

export const routes: Routes = [
  {
    path: 'sign-in',
    title: 'Sign in' + TITLE_SUFFIX,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tenants' },
      {
        path: 'tenants',
        title: 'Tenants' + TITLE_SUFFIX,
        data: { crumb: 'Tenants' },
        loadComponent: () => import('./features/tenants/tenant-list').then((m) => m.TenantList),
      },
      {
        path: 'tenants/:id',
        title: 'Tenant' + TITLE_SUFFIX,
        data: { crumb: 'Tenant details' },
        loadComponent: () => import('./features/tenants/tenant-detail').then((m) => m.TenantDetail),
      },
      {
        path: 'audit',
        title: 'Audit logs' + TITLE_SUFFIX,
        data: { crumb: 'Audit logs' },
        loadComponent: () => import('./features/audit/audit-log').then((m) => m.AuditLog),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
