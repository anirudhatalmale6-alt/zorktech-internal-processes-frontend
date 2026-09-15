import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Card } from '../../shared/ui/card/card';
import { CellTemplate, SortState, TableColumn } from '../../shared/ui/data-table/data-table.models';
import { DataTable } from '../../shared/ui/data-table/data-table';
import { FilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PageState, Pagination } from '../../shared/ui/pagination/pagination';
import { ProcessRow, STATUS_LABELS, STATUS_TONES } from '../dashboard/dashboard.models';
import { ProcessesService } from './processes.service';
import { ProgressBar } from '../../shared/ui/progress-bar/progress-bar';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { DEFAULT_QUERY, ProcessQuery, activeFilterCount } from './processes.models';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'zt-processes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    CellTemplate,
    DataTable,
    DatePipe,
    FilterBar,
    PageHeader,
    Pagination,
    ProgressBar,
    StatusBadge,
  ],
  templateUrl: './processes-list.html',
  styleUrl: './processes-list.scss',
})
export class ProcessesList {
  private readonly service = inject(ProcessesService);
  private readonly router = inject(Router);

  readonly query = signal<ProcessQuery>({ ...DEFAULT_QUERY });
  readonly rows = signal<readonly ProcessRow[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly owners = signal<readonly string[]>([]);

  /**
   * Bound to the search input directly, separate from `query.search`.
   *
   * Typing must update the visible input on every keystroke, but only reach
   * the server after a pause. Sharing one signal for both makes the field feel
   * laggy; sharing it the other way fires a request per character.
   */
  readonly searchText = signal('');

  readonly activeFilters = computed(() => activeFilterCount(this.query()));

  readonly sort = computed<SortState>(() => ({
    key: this.query().sortKey,
    direction: this.query().sortDirection,
  }));

  readonly statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  readonly columns: readonly TableColumn<ProcessRow>[] = [
    { key: 'reference', label: 'Reference', width: '8rem', sortable: true },
    { key: 'name', label: 'Process', width: 'minmax(14rem, 2fr)', sortable: true },
    { key: 'status', label: 'Status', width: '9rem', sortable: true },
    { key: 'stage', label: 'Current stage', width: 'minmax(9rem, 1fr)' },
    { key: 'progress', label: 'Progress', width: '9rem', align: 'right', sortable: true },
    { key: 'owner', label: 'Owner', width: '9.5rem', sortable: true },
    { key: 'updatedAt', label: 'Updated', width: '9rem', align: 'right', sortable: true },
  ];

  private readonly searchInput = new Subject<string>();

  constructor() {
    // Every query change triggers exactly one request. switchMap cancels the
    // in-flight one, which is what stops a slow page-2 response landing after
    // a fast page-3 response and painting the wrong page — a race that only
    // shows up on a loaded server, i.e. in production.
    toObservable(this.query)
      .pipe(
        switchMap((query) => {
          this.loading.set(true);

          return this.service.list(query);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
          this.total.set(page.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.searchInput
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.patchQuery({ search }));

    this.service
      .owners()
      .pipe(takeUntilDestroyed())
      .subscribe((names) => this.owners.set(names));
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.searchInput.next(value);
  }

  onStatusChange(event: Event): void {
    this.patchQuery({ status: (event.target as HTMLSelectElement).value as ProcessQuery['status'] });
  }

  onOwnerChange(event: Event): void {
    this.patchQuery({ owner: (event.target as HTMLSelectElement).value });
  }

  onSortChange(sort: SortState): void {
    // Sorting returns to page 1: staying on page 4 after re-sorting shows the
    // fourth page of a completely different ordering, which reads as the sort
    // having done nothing.
    this.query.update((current) => ({
      ...current,
      sortKey: sort.key,
      sortDirection: sort.direction,
      page: 1,
    }));
  }

  onPageChange(page: PageState): void {
    this.query.update((current) => ({ ...current, ...page }));
  }

  clearFilters(): void {
    this.searchText.set('');
    // Push the cleared value through the debounced stream too, otherwise a
    // pending keystroke fires 300ms later and re-applies the search that was
    // just cleared.
    this.searchInput.next('');

    this.query.update((current) => ({
      ...current,
      search: '',
      status: '',
      owner: '',
      page: 1,
    }));
  }

  openProcess(row: ProcessRow): void {
    void this.router.navigate(['/processes', row.id]);
  }

  statusLabel(row: ProcessRow): string {
    return STATUS_LABELS[row.status];
  }

  statusTone(row: ProcessRow) {
    return STATUS_TONES[row.status];
  }

  /** Any filter change resets to page 1 — see onSortChange for why. */
  private patchQuery(patch: Partial<ProcessQuery>): void {
    this.query.update((current) => ({ ...current, ...patch, page: 1 }));
  }
}
