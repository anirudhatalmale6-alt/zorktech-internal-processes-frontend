import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MessagePage } from './message-page';

@Component({
  selector: 'zt-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MessagePage],
  template: `
    <zt-message-page
      code="403"
      title="You don't have access to this"
      description="Your account doesn't include permission for this area. Ask an administrator if you think that's wrong."
    />
  `,
})
export class Forbidden {}
