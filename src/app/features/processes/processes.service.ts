import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { ApiService } from '../../core/http/api.service';
import { ProcessRow, ProcessStatus } from '../dashboard/dashboard.models';
import { Page, ProcessQuery } from './processes.models';

/**
 * Process list/detail data access.
 *
 * ── PLACEHOLDER DATA ────────────────────────────────────────────────────────
 * Filtering, sorting and paging are performed here against an in-memory array
 * purely so the screen behaves realistically before the API exists. The real
 * call is commented directly above each stub.
 *
 * Note this local work is what the SERVER will do. The component does none of
 * it — it sends a query and renders what comes back. That is the whole point:
 * when this file is swapped for real HTTP calls, the screen does not change.
 */
@Injectable({ providedIn: 'root' })
export class ProcessesService {
  private readonly api = inject(ApiService);

  list(query: ProcessQuery): Observable<Page<ProcessRow>> {
    // return this.api.get<Page<ProcessRow>>('processes', {
    //   search: query.search,
    //   status: query.status,
    //   owner: query.owner,
    //   page: query.page,
    //   pageSize: query.pageSize,
    //   sort: `${query.sortKey}:${query.sortDirection}`,
    // });

    const filtered = SAMPLE_PROCESSES.filter((row) => {
      const matchesSearch =
        !query.search ||
        `${row.reference} ${row.name} ${row.owner}`
          .toLowerCase()
          .includes(query.search.toLowerCase());

      const matchesStatus = !query.status || row.status === query.status;
      const matchesOwner = !query.owner || row.owner === query.owner;

      return matchesSearch && matchesStatus && matchesOwner;
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = query.sortDirection === 'asc' ? 1 : -1;
      const left = (a as unknown as Record<string, unknown>)[query.sortKey];
      const right = (b as unknown as Record<string, unknown>)[query.sortKey];

      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }

      return String(left ?? '').localeCompare(String(right ?? '')) * direction;
    });

    const start = (query.page - 1) * query.pageSize;

    return of<Page<ProcessRow>>({
      items: sorted.slice(start, start + query.pageSize),
      // The total is of the FILTERED set, not the whole table — it drives the
      // pager, and paging over an unfiltered total would offer page 4 of a
      // result set that has one page.
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    }).pipe(delay(350));
  }

  get(id: string): Observable<ProcessRow | undefined> {
    // return this.api.get<ProcessRow>(`processes/${id}`);

    return of(SAMPLE_PROCESSES.find((row) => row.id === id)).pipe(delay(300));
  }

  /** Distinct owners, for the owner filter. Real version hits a lookup endpoint. */
  owners(): Observable<string[]> {
    // return this.api.get<string[]>('processes/owners');

    const names = [...new Set(SAMPLE_PROCESSES.map((row) => row.owner).filter(Boolean))];

    return of(names.sort()).pipe(delay(150));
  }

  advanceStage(id: string, note: string): Observable<void> {
    // return this.api.post<void>(`processes/${id}/advance`, { note });

    console.info('[processes] advance', id, note);

    return of(undefined).pipe(delay(400));
  }
}

const OWNERS = ['Ana Duarte', 'Marco Feliu', 'Priya Raman', 'Sofia Klein', 'Tomas Berg'];

const NAMES = [
  'Supplier onboarding — Marchetti Componentes S.A.',
  'Quarterly stock reconciliation',
  'Equipment transfer request',
  'Customer credit limit increase',
  'New hire workstation provisioning',
  'Annual insurance policy renewal',
  'Warehouse relocation — Bay 4',
  'Contract renewal — Ferreira Logistics',
  'Purchase order approval',
  'Expense report review',
  'Vendor compliance audit',
  'Asset disposal request',
];

// 'Closed' is deliberately NOT in this list. It belongs only to a completed
// process, and sample data showing "In review / Closed" reads as a real bug to
// anyone reviewing the screen — incoherent demo data costs more time than it
// saves.
const STAGES = [
  'Compliance check',
  'Manager approval',
  'Awaiting warehouse count',
  'Legal review',
  'IT queue',
  'Finance sign-off',
];

const STATUSES: ProcessStatus[] = ['running', 'blocked', 'review', 'completed'];

/**
 * 83 sample rows — deliberately not a round number, and more than one page at
 * every page size, so pagination is actually exercised rather than looking
 * correct on a single short page.
 */
const SAMPLE_PROCESSES: ProcessRow[] = Array.from({ length: 83 }, (_, index) => {
  const status = STATUSES[index % STATUSES.length];
  const day = 15 - Math.floor(index / 6);
  const hour = 8 + (index % 10);

  return {
    id: String(index + 1),
    reference: `PRC-${2481 - index}`,
    name: NAMES[index % NAMES.length],
    // Every 11th row has no owner, so the em-dash path stays visible in the UI
    // rather than only existing in theory.
    owner: index % 11 === 0 ? '' : OWNERS[index % OWNERS.length],
    status,
    stage: status === 'completed' ? 'Closed' : STAGES[index % STAGES.length],
    updatedAt: `2026-09-${String(Math.max(day, 1)).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00Z`,
    progress: status === 'completed' ? 100 : (index * 13) % 96,
  };
});
