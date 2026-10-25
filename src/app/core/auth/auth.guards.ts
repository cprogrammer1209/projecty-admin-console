import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

export const authGuard: CanActivateFn = () =>
  inject(AdminAuthService).isAuthenticated() || inject(Router).parseUrl('/sign-in');

export const guestGuard: CanActivateFn = () =>
  !inject(AdminAuthService).isAuthenticated() || inject(Router).parseUrl('/tenants');
