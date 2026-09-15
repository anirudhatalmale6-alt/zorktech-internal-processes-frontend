import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Card } from '../../shared/ui/card/card';
import { DetailItem, DetailList } from '../../shared/ui/detail-list/detail-list';
import { FormField } from '../../shared/forms/form-field/form-field';
import { Modal } from '../../shared/ui/modal/modal';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProcessRow, STATUS_LABELS, STATUS_TONES } from '../dashboard/dashboard.models';
import { ProcessesService } from './processes.service';
import { ProgressBar } from '../../shared/ui/progress-bar/progress-bar';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { ToastService } from '../../core/notifications/toast.service';
import { isApiError } from '../../core/http/api-error';

@Component({
  selector: 'zt-process-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    DetailList,
    FormField,
    Modal,
    PageHeader,
    ProgressBar,
    ReactiveFormsModule,
    RouterLink,
    StatusBadge,
  ],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.scss',
})
export class ProcessDetail {
  private readonly service = inject(ProcessesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  /**
   * Bound straight from the route by `withComponentInputBinding()`.
   *
   * Must be an `input()`, not a signal — component input binding matches route
   * params to declared inputs by name. A plain signal named `id` compiles and
   * silently stays empty, so the screen loads nothing and looks like a failed
   * request.
   */
  readonly id = input.required<string>();

  readonly process = signal<ProcessRow | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  readonly confirmOpen = signal(false);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.minLength(10)]],
    notify: [true],
  });

  readonly statusLabel = computed(() => {
    const row = this.process();

    return row ? STATUS_LABELS[row.status] : '';
  });

  readonly statusTone = computed(() => {
    const row = this.process();

    return row ? STATUS_TONES[row.status] : 'neutral';
  });

  readonly details = computed<readonly DetailItem[]>(() => {
    const row = this.process();

    if (!row) {
      return [];
    }

    return [
      { label: 'Reference', value: row.reference, mono: true },
      { label: 'Owner', value: row.owner },
      { label: 'Current stage', value: row.stage },
      { label: 'Last updated', value: formatDate(row.updatedAt) },
      { label: 'Process name', value: row.name, wide: true },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.id();

      if (!id) {
        return;
      }

      this.loading.set(true);
      this.notFound.set(false);

      this.service.get(id).subscribe({
        next: (row) => {
          // A 200 with no body is NOT the same as an error, and it is not the
          // same as a record that exists. Treating "undefined" as a loaded
          // process would render a detail screen full of em dashes that looks
          // like a data problem rather than a wrong URL.
          if (!row) {
            this.notFound.set(true);
          } else {
            this.process.set(row);
          }

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notFound.set(true);
        },
      });
    });
  }

  openConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.confirmOpen.set(true);
  }

  advance(): void {
    const row = this.process();

    if (!row) {
      return;
    }

    this.submitting.set(true);

    this.service.advanceStage(row.id, this.form.controls.note.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.confirmOpen.set(false);
        this.form.reset({ note: '', notify: true });
        this.toast.success(`${row.reference} moved to the next stage.`);
        void this.router.navigate(['/processes']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.confirmOpen.set(false);

        // Field-level messages from the backend go onto the control, so they
        // appear next to the input rather than in a toast the user has to
        // remember while retyping.
        if (isApiError(error) && error.fieldErrors?.['note']?.length) {
          this.form.controls.note.setErrors({ server: error.fieldErrors['note'][0] });
        }
      },
    });
  }

  get note() {
    return this.form.controls.note;
  }
}

function formatDate(iso: string): string {
  // Intl rather than a hand-rolled format: it respects the user's locale and
  // gets month names and 12/24-hour right without a table of special cases.
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
