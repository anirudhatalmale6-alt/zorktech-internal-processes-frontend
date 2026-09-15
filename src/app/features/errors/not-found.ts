import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagePage } from './message-page';

@Component({
  selector: 'zt-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessagePage],
  template: `
    <zt-message-page
      code="404"
      title="Page not found"
      description="That address doesn't match any screen in the system. It may have been renamed or removed."
    />
  `,
})
export class NotFound {}
