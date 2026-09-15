import { ValidationErrors } from '@angular/forms';

/**
 * One place that turns Angular's validation error objects into wording a user
 * can act on.
 *
 * Centralised because the alternative — each template writing its own
 * `@if (control.hasError('required'))` block — guarantees that the same
 * problem is worded three different ways on three different screens, and that
 * a newly added validator silently displays nothing at all.
 *
 * `label` is woven into the message so "Enter the reference" reads better than
 * a bare "This field is required" floating under an input.
 */
export function messageFor(errors: ValidationErrors | null, label: string): string | null {
  if (!errors) {
    return null;
  }

  // Order matters: report the most fundamental problem first. Telling someone
  // their empty field is "too short" is technically true and useless.
  if (errors['required']) {
    return `Enter ${indefinite(label)}.`;
  }

  if (errors['email']) {
    return 'Enter a valid email address.';
  }

  if (errors['minlength']) {
    const { requiredLength } = errors['minlength'];

    return `${label} must be at least ${requiredLength} characters.`;
  }

  if (errors['maxlength']) {
    const { requiredLength } = errors['maxlength'];

    return `${label} must be ${requiredLength} characters or fewer.`;
  }

  if (errors['min']) {
    return `${label} must be ${errors['min'].min} or more.`;
  }

  if (errors['max']) {
    return `${label} must be ${errors['max'].max} or less.`;
  }

  if (errors['pattern']) {
    return `${label} is not in the expected format.`;
  }

  // Server-side validation, pushed onto the control via setErrors({server: '…'}).
  // The backend's wording wins here — it knows business rules the frontend
  // does not, and paraphrasing it would lose the specifics.
  if (typeof errors['server'] === 'string') {
    return errors['server'];
  }

  // A validator with no message here is a gap, not something to swallow. A
  // field that is visibly invalid with no explanation is a dead end for the
  // user and invisible to us.
  console.warn('[validation] no message defined for', Object.keys(errors), 'on', label);

  return `${label} is not valid.`;
}

/** "a reference" / "an owner" — small touch, but the alternative reads wrong. */
function indefinite(label: string): string {
  const lower = label.toLowerCase();
  const article = /^[aeiou]/.test(lower) ? 'an' : 'a';

  return `${article} ${lower}`;
}
