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

export const MOCK_OVERVIEW_DATA: Record<ProgressActivityType, OverviewMockData> = {
  all: {
    activityLabel: 'All activities',
    encouragement: 'You are performing better than last month. Keep it up.',
    metrics: [
      { key: 'activities', label: 'Total Activities', value: '18' },
      { key: 'distance', label: 'Total Distance', value: '84.2 km', trend: 'up' },
      { key: 'moving-time', label: 'Moving Time', value: '12h 18m' },
      { key: 'avg-distance', label: 'Avg Distance', value: '4.7 km' },
      { key: 'avg-time', label: 'Avg Time', value: '41 min' },
      { key: 'avg-pace', label: 'Avg Pace', value: '7:04/km', trend: 'up' },
      { key: 'avg-speed', label: 'Avg Speed', value: '8.5 km/h' },
      { key: 'total-elevation', label: 'Total Elevation', value: '420 m' },
      { key: 'avg-elevation', label: 'Avg Elevation', value: '23 m' },
      { key: 'avg-cadence', label: 'Avg Cadence', value: '126' },
      { key: 'days-active', label: 'Days Active', value: '12 days', trend: 'up' },
    ],
  },
  walk: {
    activityLabel: 'Walking',
    encouragement: 'Your walking consistency is trending in the right direction.',
    metrics: [
      { key: 'activities', label: 'Total Activities', value: '9' },
      { key: 'distance', label: 'Total Distance', value: '21.6 km', trend: 'up' },
      { key: 'moving-time', label: 'Moving Time', value: '5h 12m' },
      { key: 'avg-distance', label: 'Avg Distance', value: '2.4 km' },
      { key: 'avg-time', label: 'Avg Time', value: '35 min' },
      { key: 'avg-pace', label: 'Avg Pace', value: '14:26/km', trend: 'up' },
      { key: 'avg-speed', label: 'Avg Speed', value: '4.1 km/h' },
      { key: 'total-elevation', label: 'Total Elevation', value: '86 m' },
      { key: 'avg-elevation', label: 'Avg Elevation', value: '10 m' },
      { key: 'avg-cadence', label: 'Avg Cadence', value: '98' },
      { key: 'days-active', label: 'Days Active', value: '8 days', trend: 'up' },
    ],
  },
  ride: {
    activityLabel: 'Biking',
    encouragement: 'Your biking volume is building steadily. Keep it smooth.',
    metrics: [
      { key: 'activities', label: 'Total Activities', value: '6' },
      { key: 'distance', label: 'Total Distance', value: '126.4 km', trend: 'up' },
      { key: 'moving-time', label: 'Moving Time', value: '6h 46m' },
      { key: 'avg-distance', label: 'Avg Distance', value: '21.1 km' },
      { key: 'avg-time', label: 'Avg Time', value: '68 min' },
      { key: 'avg-pace', label: 'Avg Pace', value: '-', trend: 'up' },
      { key: 'avg-speed', label: 'Avg Speed', value: '18.7 km/h' },
      { key: 'total-elevation', label: 'Total Elevation', value: '612 m' },
      { key: 'avg-elevation', label: 'Avg Elevation', value: '102 m' },
      { key: 'avg-cadence', label: 'Avg Cadence', value: '74' },
      { key: 'days-active', label: 'Days Active', value: '5 days', trend: 'up' },
    ],
  },
};
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
