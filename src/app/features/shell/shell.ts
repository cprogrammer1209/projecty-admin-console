import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, tap } from 'rxjs';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { SearchService } from '../../shared/search.service';
import { initials } from '../../shared/text';
import { Icon } from '../../shared/ui/icon';
import { Toast } from '../../shared/ui/toast';

/** Signed-in layout: sidebar, top bar (breadcrumb, search, theme, sign out) and the current screen. */
@Component({
  selector: 'pa-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Toast],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(AdminAuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly search = inject(SearchService);
  private readonly router = inject(Router);

  protected readonly crumb = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      tap(() => this.search.query.set('')),
      map(() => crumbOf(this.router.routerState.snapshot.root)),
    ),
    { initialValue: crumbOf(this.router.routerState.snapshot.root) },
  );

  protected readonly initials = initials;

  protected onSearch(event: Event): void {
    this.search.query.set((event.target as HTMLInputElement).value);
  }

  protected signOut(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/sign-in'));
  }
}

function crumbOf(route: ActivatedRouteSnapshot): string {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return (current.data['crumb'] as string | undefined) ?? '';
}
