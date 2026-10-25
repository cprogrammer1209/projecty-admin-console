import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

const TOAST_MS = 2400;

/** One short status message at a time, bottom right (the prototype's toast). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(null), TOAST_MS);
  }
}

@Component({
  selector: 'pa-toast',
  template: `<div class="toast" [class.show]="!!toast.message()" role="status">{{ toast.message() }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
