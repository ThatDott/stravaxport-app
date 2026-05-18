import type { ProgressActivityType } from '../progress-graph/progress-graph.model';

export type ImageExportStatKey =
  | 'userName'
  | 'distance'
  | 'movingTime'
  | 'averagePace'
  | 'speed'
  | 'heartRate'
  | 'cadence'
  | 'elevationGain'
  | 'dateRange'
  | 'activityType'
  | 'motivationalQuote'
  | 'geographicalData'
  | 'stravaLogo';

export type ImageExportStats = Record<ImageExportStatKey, boolean>;

export interface ImageExportStyleOptions {
  plainStats: boolean;
  compactStats: boolean;
}

export interface ImageExportPayload {
  username: string;
  activityType: ProgressActivityType;
  activityTypes: readonly string[];
  dateRange: {
    start: string;
    end: string;
  };
  stats: ImageExportStats;
  style: ImageExportStyleOptions;
  format: 'png';
}
