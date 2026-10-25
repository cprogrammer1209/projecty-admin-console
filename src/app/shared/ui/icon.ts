import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** An icon from the sprite in index.html: `name="login"` renders `#i-login`. Sized by the global svg rule. */
@Component({
  selector: 'pa-icon',
  template: `<svg aria-hidden="true"><use [attr.href]="'#i-' + name()" /></svg>`,
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<string>();
}
