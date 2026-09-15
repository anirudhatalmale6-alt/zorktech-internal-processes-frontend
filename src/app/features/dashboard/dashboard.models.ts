import { StatusTone } from '../../shared/ui/status-badge/status-badge';

/**
 * Dashboard view models — PROVISIONAL, to be replaced by the real API types
 * once the Swagger document is available.
 *
 * Note these are *view* models: the shapes the screen wants, not necessarily
 * the shapes the backend returns. Keeping the two separate means a backend
 * field rename touches one mapping function instead of every template.
 */

export interface DashboardSummary {
  activeProcesses: number;
  activeProcessesDelta: number;
  completedThisMonth: number;
  completedThisMonthDelta: number;
  averageCycleHours: number;
  averageCycleHoursDelta: number;
  overdueTasks: number;
  overdueTasksDelta: number;
}

export interface ThroughputPoint {
  label: string;
  started: number;
  completed: number;
}

export type ProcessStatus = 'running' | 'blocked' | 'review' | 'completed';

export interface ProcessRow {
  id: string;
  reference: string;
  name: string;
  owner: string;
  status: ProcessStatus;
  stage: string;
  updatedAt: string;
  progress: number;
}

export const STATUS_LABELS: Record<ProcessStatus, string> = {
  running: 'In progress',
  blocked: 'Blocked',
  review: 'In review',
  completed: 'Completed',
};

export const STATUS_TONES: Record<ProcessStatus, StatusTone> = {
  running: 'info',
  blocked: 'danger',
  review: 'warning',
  completed: 'success',
};
