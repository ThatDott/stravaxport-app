export type ProgressActivityType = 'all' | 'walk' | 'ride' | 'run';

export interface ProgressActivityOption {
  value: ProgressActivityType;
  label: string;
}

export interface ProgressPoint {
  label: string;
  rangeLabel: string;
  distanceKm: number;
  walkDistanceKm: number;
  rideDistanceKm: number;
  runDistanceKm: number;
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
