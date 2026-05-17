export type ProgressActivityType = 'all' | 'walk' | 'ride';

export interface ProgressActivityOption {
  value: ProgressActivityType;
  label: string;
}

export interface ProgressPoint {
  label: string;
  rangeLabel: string;
  distanceKm: number;
}

export interface ProgressSummary {
  totalActivities: number;
  totalDistanceKm: number;
  totalMovingTimeSeconds: number;
  totalElevationM: number;
  rangeLabel: string;
}

export interface ProgressGraphData {
  points: readonly ProgressPoint[];
  summary: ProgressSummary;
}
