export interface ActivitySummaryResponse {
  total_activities: number;
  total_distance_km: number;
  total_moving_time_seconds: number;
  formatted_moving_time: string;
  avg_distance_km: number;
  avg_time_minutes: number;
  avg_pace_formatted: string;
  avg_speed_kmh: number;
  total_elevation_m: number;
  avg_elevation_m: number;
  avg_cadence?: number | null;
  avg_hr?: number | null;
  days_active: number;
}
