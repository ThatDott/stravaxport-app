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

export interface OverviewMockData {
  activityLabel: string;
  encouragement: string;
  metrics: readonly OverviewMetric[];
}

export const MOCK_OVERVIEW_DATA: OverviewMockData = {
  activityLabel: 'All activities',
  encouragement: 'You are performing better than last month. Keep it up.',
  metrics: [
    { key: 'activities', label: 'Total Activities', value: '0' },
    { key: 'distance', label: 'Total Distance', value: '0.0 km', trend: 'up' },
    { key: 'moving-time', label: 'Moving Time', value: '0h 0m' },
    { key: 'avg-distance', label: 'Avg Distance', value: '0.0 km' },
    { key: 'avg-time', label: 'Avg Time', value: '0 min' },
    { key: 'avg-pace', label: 'Avg Pace', value: '-', trend: 'up' },
    { key: 'avg-speed', label: 'Avg Speed', value: '-' },
    { key: 'total-elevation', label: 'Total Elevation', value: '0 m' },
    { key: 'avg-elevation', label: 'Avg Elevation', value: '0 m' },
    { key: 'avg-cadence', label: 'Avg Cadence', value: '0' },
    { key: 'days-active', label: 'Days Active', value: '6 days', trend: 'up' },
  ],
};
