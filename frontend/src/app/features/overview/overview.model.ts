export type OverviewMetricKey =
  | 'activities'
  | 'distance'
  | 'moving-time'
  | 'avg-distance'
  | 'avg-time'
  | 'avg-pace'
  | 'avg-speed'
  | 'total-elevation'
  | 'avg-elevation'
  | 'avg-cadence'
  | 'days-active';

export interface OverviewMetric {
  key: OverviewMetricKey;
  label: string;
  value: string;
  trend?: 'up';
}

export interface OverviewData {
  activityLabel: string;
  encouragement: string;
  metrics: readonly OverviewMetric[];
}
