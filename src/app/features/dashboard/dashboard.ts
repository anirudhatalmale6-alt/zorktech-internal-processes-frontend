import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { BarChart, BarSeries } from '../../shared/ui/bar-chart/bar-chart';
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
  ProcessRow,
  STATUS_LABELS,
  STATUS_TONES,
  ThroughputPoint,
} from './dashboard.models';

@Component({
  selector: 'zt-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BarChart,
    Card,
    CellTemplate,
    DataTable,
    DatePipe,
    PageHeader,
    ProgressBar,
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
  readonly throughput = signal<readonly ThroughputPoint[]>([]);
  readonly processes = signal<readonly ProcessRow[]>([]);

  readonly summaryLoading = signal(true);
  readonly chartLoading = signal(true);
  readonly tableLoading = signal(true);

  readonly sort = signal<SortState>({ key: 'updatedAt', direction: 'desc' });

  readonly columns: readonly TableColumn<ProcessRow>[] = [
    { key: 'reference', label: 'Reference', width: '8rem', sortable: true },
    { key: 'name', label: 'Process', width: 'minmax(16rem, 2fr)', sortable: true },
    { key: 'status', label: 'Status', width: '9rem' },
    { key: 'stage', label: 'Current stage', width: 'minmax(10rem, 1fr)' },
    { key: 'progress', label: 'Progress', width: '9rem', align: 'right' },
    { key: 'owner', label: 'Owner', width: '10rem', sortable: true },
    { key: 'updatedAt', label: 'Updated', width: '9rem', align: 'right', sortable: true },
  ];

  readonly chartCategories = computed(() => this.throughput().map((point) => point.label));

  readonly chartSeries = computed<readonly BarSeries[]>(() => [
    {
      key: 'started',
      label: 'Started',
      color: 'var(--brand-primary)',
      values: this.throughput().map((point) => point.started),
    },
    {
      key: 'completed',
      label: 'Completed',
      color: 'var(--brand-secondary)',
      values: this.throughput().map((point) => point.completed),
    },
  ]);

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
      .getThroughput()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => {
          this.throughput.set(data);
          this.chartLoading.set(false);
        },
        error: () => this.chartLoading.set(false),
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
