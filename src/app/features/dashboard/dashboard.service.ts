import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { ApiService } from '../../core/http/api.service';
import {
  DashboardSummary,
  OwnerWorkload,
  ProcessRow,
  StatusBreakdownRow,
} from './dashboard.models';

/**
 * Dashboard data access.
 *
 * ── PLACEHOLDER DATA ────────────────────────────────────────────────────────
 * Every method currently returns sample data on a short delay so the UI can be
 * built and reviewed before the API is wired up. The real call sits directly
 * above each stub, commented out. When the Swagger document arrives the change
 * is: uncomment the request, delete the stub, correct the endpoint path.
 *
 * The sample values are deliberately irregular — no round numbers, uneven
 * deltas, one blocked process — because tidy demo data hides the layout
 * problems that real data causes: the overflowing name, the negative delta,
 * the row with a missing owner.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<DashboardSummary> {
    // return this.api.get<DashboardSummary>('dashboard/summary');

    return of<DashboardSummary>({
      activeProcesses: 147,
      activeProcessesDelta: 0.082,
      completedThisMonth: 1284,
      completedThisMonthDelta: 0.041,
      averageCycleHours: 18.4,
      averageCycleHoursDelta: -0.067,
      overdueTasks: 23,
      overdueTasksDelta: 0.15,
    }).pipe(delay(400));
  }

  getStatusBreakdown(): Observable<StatusBreakdownRow[]> {
    // return this.api.get<StatusBreakdownRow[]>('dashboard/by-status');

    return of<StatusBreakdownRow[]>([
      { status: 'running', count: 68 },
      { status: 'review', count: 41 },
      { status: 'blocked', count: 23 },
      { status: 'completed', count: 15 },
    ]).pipe(delay(450));
  }

  getOwnerWorkload(): Observable<OwnerWorkload[]> {
    // return this.api.get<OwnerWorkload[]>('dashboard/workload');

    return of<OwnerWorkload[]>([
      { owner: 'Ana Duarte', active: 34, blocked: 6 },
      { owner: 'Marco Feliu', active: 28, blocked: 9 },
      { owner: 'Priya Raman', active: 26, blocked: 2 },
      { owner: 'Sofia Klein', active: 19, blocked: 4 },
      { owner: 'Tomas Berg', active: 17, blocked: 2 },
      // Unassigned deliberately present: work with no owner is exactly what a
      // workload panel exists to surface, and dropping it would hide it.
      { owner: '', active: 8, blocked: 0 },
    ]).pipe(delay(500));
  }

  getRecentProcesses(): Observable<ProcessRow[]> {
    // return this.api.get<ProcessRow[]>('processes', { limit: 8, sort: 'updatedAt:desc' });

    return of<ProcessRow[]>([
      {
        id: '1',
        reference: 'PRC-2481',
        name: 'Supplier onboarding — Marchetti Componentes S.A.',
        owner: 'Ana Duarte',
        status: 'running',
        stage: 'Compliance check',
        updatedAt: '2026-09-15T14:32:00Z',
        progress: 62,
      },
      {
        id: '2',
        reference: 'PRC-2479',
        name: 'Quarterly stock reconciliation',
        owner: 'Marco Feliu',
        status: 'blocked',
        stage: 'Awaiting warehouse count',
        updatedAt: '2026-09-15T13:05:00Z',
        progress: 34,
      },
      {
        id: '3',
        reference: 'PRC-2477',
        name: 'Equipment transfer request',
        owner: 'Priya Raman',
        status: 'review',
        stage: 'Manager approval',
        updatedAt: '2026-09-15T11:48:00Z',
        progress: 88,
      },
      {
        id: '4',
        reference: 'PRC-2474',
        name: 'Customer credit limit increase',
        owner: 'Ana Duarte',
        status: 'completed',
        stage: 'Closed',
        updatedAt: '2026-09-15T09:20:00Z',
        progress: 100,
      },
      {
        id: '5',
        reference: 'PRC-2470',
        name: 'New hire workstation provisioning',
        // Deliberately empty — proves the table renders a missing value as an
        // em dash rather than a blank cell that looks like a loading failure.
        owner: '',
        status: 'running',
        stage: 'IT queue',
        updatedAt: '2026-09-14T16:11:00Z',
        progress: 15,
      },
      {
        id: '6',
        reference: 'PRC-2468',
        name: 'Annual insurance policy renewal',
        owner: 'Sofia Klein',
        status: 'review',
        stage: 'Legal review',
        updatedAt: '2026-09-14T10:02:00Z',
        progress: 71,
      },
    ]).pipe(delay(650));
  }
}
