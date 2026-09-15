import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { EmptyState } from '../empty-state/empty-state';
import { CellTemplate, SortState, TableColumn } from './data-table.models';

/**
 * Reusable table for the interactive lists across the system.
 *
 * Sorting is emitted, not performed. The rows shown are whatever the parent
 * passes in — so a server-paginated list sorts on the server across the whole
 * result set, rather than reordering only the current page and looking, very
 * convincingly, like it sorted everything.
 */
@Component({
  selector: 'zt-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, EmptyState],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T extends object> {
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();

  /** Property used as the track key. Falls back to index if absent on a row. */
  readonly rowKey = input<keyof T | 'id'>('id');

  readonly loading = input(false);
  readonly sort = input<SortState | null>(null);

  /** True when filters are applied, so the empty state says so. */
  readonly filtered = input(false);
  readonly emptyTitle = input('Nothing to show');
  readonly emptyDescription = input('');

  readonly sortChange = output<SortState>();
  readonly rowClick = output<T>();

  private readonly cellTemplates = contentChildren(CellTemplate);

  /** Rows rendered while `loading` is true, to hold the layout steady. */
  readonly skeletonRows = [0, 1, 2, 3, 4];

  readonly gridTemplate = computed(() =>
    this.columns()
      .map((column) => column.width ?? 'minmax(6rem, auto)')
      .join(' '),
  );

  templateFor(key: string) {
    return this.cellTemplates().find((cell) => cell.key() === key)?.template ?? null;
  }

  /**
   * Default cell text.
   *
   * Renders an em dash for null/undefined rather than an empty cell: a blank
   * cell is ambiguous between "no value" and "failed to load", and in a grid
   * of hundreds of rows that ambiguity gets escalated as a bug.
   */
  display(row: T, column: TableColumn<T>): string {
    const raw = column.value
      ? column.value(row)
      : (row as Record<string, unknown>)[column.key];

    if (raw === null || raw === undefined || raw === '') {
      return '—';
    }

    return String(raw);
  }

  trackRow = (index: number, row: T): unknown => {
    const key = (row as Record<string, unknown>)[this.rowKey() as string];

    return key ?? index;
  };

  onHeaderClick(column: TableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    const current = this.sort();
    const direction =
      current?.key === column.key && current.direction === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({ key: column.key, direction });
  }

  ariaSortFor(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }

    const current = this.sort();

    if (current?.key !== column.key) {
      return 'none';
    }

    return current.direction === 'asc' ? 'ascending' : 'descending';
  }
}
