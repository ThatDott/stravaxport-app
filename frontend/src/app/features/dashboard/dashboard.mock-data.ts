import type { DateRange } from '../calendar/calendar.component';

export interface DashboardUserMock {
  displayName: string;
  avatarUrl: string;
  dailyStatus: string;
  connectionLabel: string;
}

export const MOCK_DASHBOARD_USER: DashboardUserMock = {
  displayName: '<user-name>',
  avatarUrl: '/user-icon.jpg',
  dailyStatus: "You haven't run today.",
  connectionLabel: 'Preview mode',
};

export function createMockInitialDateRange(): DateRange {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(end.getDate() - 29);

  return { start, end };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  return next;
}
