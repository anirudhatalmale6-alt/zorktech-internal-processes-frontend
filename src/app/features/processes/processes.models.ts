import { ProcessStatus } from '../dashboard/dashboard.models';

export { STATUS_LABELS, STATUS_TONES } from '../dashboard/dashboard.models';
export type { ProcessStatus } from '../dashboard/dashboard.models';

/**
 * Query sent to the list endpoint.
 *
 * One object rather than loose parameters so the whole query is a single unit
 * of state: it can be written to the URL, restored on reload, and compared
 * against the previous query to decide whether a request is even needed.
 */
export interface ProcessQuery {
  search: string;
  status: ProcessStatus | '';
  owner: string;
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
}

export const DEFAULT_QUERY: ProcessQuery = {
  search: '',
  status: '',
  owner: '',
  page: 1,
  pageSize: 25,
  sortKey: 'updatedAt',
  sortDirection: 'desc',
};

/** Standard envelope for a paginated list. Confirm against Swagger. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * How many filters are set, for the "N filters applied" chip.
 *
 * Counts only the fields a user chose — not page, page size or sort, which are
 * always set and would make the chip read "3 filters applied" on an untouched
 * screen.
 */
export function activeFilterCount(query: ProcessQuery): number {
  return [query.search, query.status, query.owner].filter((value) => value !== '').length;
}
