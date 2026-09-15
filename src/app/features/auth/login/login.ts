import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { APP_CONFIG } from '../../../core/config/app-config';
import { AuthService } from '../../../core/auth/auth.service';
import { isApiError } from '../../../core/http/api-error';

@Component({
  selector: 'zt-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly environmentLabel = inject(APP_CONFIG).environmentLabel;

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      // Mark everything touched so the messages appear on the first attempt
      // rather than only after the user has visited each field.
      this.form.markAllAsTouched();

      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        // returnUrl comes from the query string, which anyone can edit. Only
        // same-origin relative paths are honoured — accepting an absolute URL
        // here turns the login screen into an open redirect, the classic way a
        // phishing link gets to borrow a trusted domain.
        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = isSafeReturnUrl(requested) ? requested! : '/dashboard';

        void this.router.navigateByUrl(target);
      },
      error: (error: unknown) => {
        this.submitting.set(false);

        // Deliberately generic on a 401: saying "no such user" versus "wrong
        // password" tells an attacker which usernames are real.
        this.errorMessage.set(
          isApiError(error) && error.status !== 401
            ? error.message
            : 'Those details were not recognised. Please try again.',
        );
      },
    });
  }

  get username() {
    return this.form.controls.username;
  }

  get password() {
    return this.form.controls.password;
  }
}

function isSafeReturnUrl(url: string | null): boolean {
  if (!url) {
    return false;
  }

  // Must be a root-relative path, and must not start with `//` (which browsers
  // read as protocol-relative and will happily send off-site).
  return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
}
