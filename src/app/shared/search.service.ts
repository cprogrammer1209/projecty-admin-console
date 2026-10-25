import { Injectable, signal } from '@angular/core';

/** The top bar's search box; list screens filter by it. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly query = signal('');
}
