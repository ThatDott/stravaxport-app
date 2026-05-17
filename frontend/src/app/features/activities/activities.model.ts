import type { ProgressActivityType } from '../progress-graph/progress-graph.model';

export interface ActivityItem {
  id: string;
  name: string;
  activityType: Exclude<ProgressActivityType, 'all'>;
  date: Date;
  distanceKm: number;
  movingTimeSeconds: number;
  paceLabel: string;
  speedLabel: string;
  elevationM: number;
}

export interface ActivityDateGroup {
  key: string;
  label: string;
  activities: readonly ActivityItem[];
}
