import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { Card } from '../../shared/ui/card/card';
import { CellTemplate, SortState, TableColumn } from '../../shared/ui/data-table/data-table.models';
import { DataTable } from '../../shared/ui/data-table/data-table';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProgressBar } from '../../shared/ui/progress-bar/progress-bar';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';
import { DashboardService } from './dashboard.service';
import {
  DashboardSummary,
  OwnerWorkload,
  ProcessRow,
  STATUS_LABELS,
  STATUS_TONES,
  StatusBreakdownRow,
} from './dashboard.models';

@Component({
  selector: 'zt-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    CellTemplate,
    DataTable,
    DatePipe,
    DecimalPipe,
    PageHeader,
    ProgressBar,
    RouterLink,
    StatTile,
    StatusBadge,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly service = inject(DashboardService);
  private readonly router = inject(Router);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly breakdown = signal<readonly StatusBreakdownRow[]>([]);
  readonly workload = signal<readonly OwnerWorkload[]>([]);
  readonly processes = signal<readonly ProcessRow[]>([]);

  readonly summaryLoading = signal(true);
  readonly breakdownLoading = signal(true);
  readonly workloadLoading = signal(true);
  readonly tableLoading = signal(true);

  readonly sort = signal<SortState>({ key: 'updatedAt', direction: 'desc' });

  readonly columns: readonly TableColumn<ProcessRow>[] = [
    { key: 'reference', label: 'Reference', width: '8rem', sortable: true },
    { key: 'name', label: 'Process', width: 'minmax(14rem, 2fr)', sortable: true },
    { key: 'status', label: 'Status', width: '9rem' },
    { key: 'stage', label: 'Current stage', width: 'minmax(9rem, 1fr)' },
    { key: 'progress', label: 'Progress', width: '9rem', align: 'right' },
    { key: 'owner', label: 'Owner', width: '9.5rem', sortable: true },
    { key: 'updatedAt', label: 'Updated', width: '9rem', align: 'right', sortable: true },
  ];

  readonly breakdownTotal = computed(() =>
    this.breakdown().reduce((sum, row) => sum + row.count, 0),
  );

  /**
   * Breakdown rows with their share of the total.
   *
   * Share is derived here rather than taken from the backend: two numbers that
   * must agree are two numbers that can disagree, and a panel whose percentages
   * don't total 100 discredits the whole dashboard.
   */
  readonly breakdownRows = computed(() => {
    const total = this.breakdownTotal();

    return this.breakdown().map((row) => ({
      ...row,
      label: STATUS_LABELS[row.status],
      tone: STATUS_TONES[row.status],
      // Guard the divide: an empty system is a legitimate state, and 0/0 here
      // would put NaN% on screen on day one.
      share: total > 0 ? (row.count / total) * 100 : 0,
    }));
  });

  /** Busiest first — the panel exists to show where the load sits. */
  readonly workloadRows = computed(() =>
    [...this.workload()].sort((a, b) => b.active - a.active),
  );

  readonly workloadPeak = computed(() =>
    Math.max(1, ...this.workloadRows().map((row) => row.active)),
  );

  constructor() {
    this.service
      .getSummary()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.summary.set(data);
          this.summaryLoading.set(false);
        },
        // The error interceptor has already toasted and logged this. All that
        // is left here is to stop the skeletons spinning forever, which is the
        // failure mode that makes a broken screen look like a slow one.
        error: () => this.summaryLoading.set(false),
      });

    this.service
      .getStatusBreakdown()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.breakdown.set(data);
          this.breakdownLoading.set(false);
        },
        error: () => this.breakdownLoading.set(false),
      });

    this.service
      .getOwnerWorkload()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.workload.set(data);
          this.workloadLoading.set(false);
        },
        error: () => this.workloadLoading.set(false),
      });

    this.service
      .getRecentProcesses()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.processes.set(data);
          this.tableLoading.set(false);
        },
        error: () => this.tableLoading.set(false),
      });
  }

  statusLabel(row: ProcessRow): string {
    return STATUS_LABELS[row.status];
  }

  statusTone(row: ProcessRow) {
    return STATUS_TONES[row.status];
  }

  /** Jumps to the list already filtered — the panel is a shortcut, not just a figure. */
  openStatus(status: string): void {
    void this.router.navigate(['/processes'], { queryParams: { status } });
  }

  onSortChange(next: SortState): void {
    this.sort.set(next);

    // Placeholder: once the list endpoint is connected this re-requests the
    // page with the new sort, so the ordering applies across the whole result
    // set and not just the rows already downloaded.
    this.tableLoading.set(true);
    this.service.getRecentProcesses().subscribe({
      next: (data) => {
        this.processes.set(data);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false),
    });
  }

  onRowClick(row: ProcessRow): void {
    void this.router.navigate(['/processes', row.id]);
  }
}
