import { Directive, TemplateRef, inject, input } from '@angular/core';

export type ColumnAlign = 'left' | 'right' | 'center';

export interface TableColumn<T> {
  /** Matches the `key` on a `*ztCell` template, and the property read by default. */
  key: string;

  label: string;

  /**
   * Alignment. Numeric columns should be 'right' — a right-aligned column of
   * figures lines up by place value, so 1,200 and 980 are instantly comparable.
   */
  align?: ColumnAlign;

  /** CSS width, e.g. '8rem' or 'minmax(12rem, 1fr)'. Omit to size to content. */
  width?: string;

  sortable?: boolean;

  /** Default accessor when no `*ztCell` template is supplied for this key. */
  value?: (row: T) => string | number | null | undefined;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

/**
 * Per-column cell template:
 *
 *   <ng-template ztCell key="status" let-row>
 *     <zt-status-badge [label]="row.statusLabel" [tone]="row.tone" />
 *   </ng-template>
 *
 * Templates rather than a render function so cells can contain real components
 * with their own bindings, not stringified HTML.
 */
@Directive({ selector: '[ztCell]' })
export class CellTemplate {
  readonly key = input.required<string>({ alias: 'ztCell' });
  readonly template = inject(TemplateRef);
}
