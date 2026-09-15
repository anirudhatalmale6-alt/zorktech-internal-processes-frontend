import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { messageFor } from '../validation-messages';

/**
 * Label + control + hint + error, wired together correctly.
 *
 * The wiring is the point. Getting `for`/`id`, `aria-describedby` and
 * `aria-invalid` right by hand on every field is tedious and therefore skipped,
 * and the result is a form where the error text is visible but not announced,
 * and clicking a label doesn't focus its input.
 *
 * The control element itself is projected rather than wrapped, so native
 * behaviour — autofill, browser validation, password managers — is untouched:
 *
 *   <zt-form-field label="Reference" [control]="form.controls.reference" controlId="reference">
 *     <input id="reference" class="input" formControlName="reference" />
 *   </zt-form-field>
 */
@Component({
  selector: 'zt-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label class="field__label" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) {
          <span class="field__required" aria-hidden="true">*</span>
          <span class="u-visually-hidden">(required)</span>
        }
      </label>

      <ng-content />

      @if (hint() && !errorMessage()) {
        <p class="field__hint" [id]="controlId() + '-hint'">{{ hint() }}</p>
      }

      @if (errorMessage(); as message) {
        <p class="field__error" [id]="controlId() + '-error'" role="alert">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          {{ message }}
        </p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class FormField {
  readonly label = input.required<string>();

  /** Must match the id on the projected control. */
  readonly controlId = input.required<string>();

  readonly control = input<AbstractControl | null>(null);
  readonly hint = input<string>('');

  /** Overrides the inferred required state when a validator isn't the source. */
  readonly requiredOverride = input<boolean | null>(null, { alias: 'required' });

  readonly required = computed(() => {
    const override = this.requiredOverride();

    return override !== null ? override : hasRequired(this.control());
  });

  /**
   * Ticks on every status/value/touched change of the bound control.
   *
   * Reactive forms are not signal-based: `control.touched` and `control.errors`
   * are plain properties, so a `computed()` reading them takes a dependency on
   * nothing and never recomputes. The error text would be correct on first
   * render and then frozen — so calling `markAllAsTouched()` on submit would
   * mark the form touched and display absolutely nothing.
   *
   * Subscribing to `control.events` gives the computed below something that
   * actually changes.
   */
  private readonly revision = signal(0);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();

      if (!control) {
        return;
      }

      const subscription = control.events.subscribe(() =>
        this.revision.update((value) => value + 1),
      );

      onCleanup(() => subscription.unsubscribe());
    });
  }

  /**
   * Errors are shown only once the field has been touched or the form
   * submitted — marking a form invalid the instant it renders, before anyone
   * has typed a character, reads as the app being broken rather than as
   * guidance.
   */
  readonly errorMessage = computed(() => {
    // Establishes the dependency that makes this recompute. Do not remove.
    this.revision();

    const control = this.control();

    if (!control || control.valid || (!control.touched && !control.dirty)) {
      return null;
    }

    return messageFor(control.errors, this.label());
  });
}

/**
 * Infers "required" by running the validator against an empty value.
 *
 * Angular gives no public way to ask a control whether it is required, and
 * comparing against `Validators.required` by reference breaks the moment the
 * field uses a composed or custom validator. Probing the actual behaviour is
 * the only approach that stays correct.
 */
function hasRequired(control: AbstractControl | null): boolean {
  if (!control?.validator) {
    return false;
  }

  const result = control.validator({ value: null } as AbstractControl);

  return !!result?.['required'];
}
