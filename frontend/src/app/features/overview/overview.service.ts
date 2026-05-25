import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import type { ActivitySummaryResponse } from '../activities/activity-summary.model';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { OverviewData, OverviewMetric } from './overview.model';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/activities/summary`;

  getOverview(range: DateRange, activity: ProgressActivityType): Observable<OverviewData> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('User is not authenticated.'));
    }

    const params = buildSummaryParams(range, activity);

    return this.http
      .get<ActivitySummaryResponse>(this.apiUrl, {
        headers: new HttpHeaders({ Authorization: 'Bearer ' + token }),
        params,
      })
      .pipe(map((summary) => buildOverviewData(summary, activity)));
  }
}

function buildSummaryParams(range: DateRange, activity: ProgressActivityType): HttpParams {
  let params = new HttpParams()
    .set('after', formatDate(range.start))
    .set('before', formatDate(addDays(range.end, 1)));

  if (activity !== 'all') {
    params = params.set('activity_type', activity);
  }

  return params;
}

function buildOverviewData(summary: ActivitySummaryResponse, activity: ProgressActivityType): OverviewData {
  const metrics: OverviewMetric[] = [
    { key: 'activities', label: 'Total Activities', value: formatCount(summary.total_activities) },
    { key: 'distance', label: 'Total Distance', value: formatDistance(summary.total_distance_km) },
    { key: 'moving-time', label: 'Moving Time', value: summary.formatted_moving_time || formatDuration(summary.total_moving_time_seconds) },
    { key: 'avg-distance', label: 'Avg Distance', value: formatDistance(summary.avg_distance_km) },
    { key: 'avg-time', label: 'Avg Time', value: `${Math.round(summary.avg_time_minutes ?? 0)} min` },
    { key: 'avg-pace', label: 'Avg Pace', value: summary.avg_pace_formatted || '-' },
    { key: 'avg-speed', label: 'Avg Speed', value: `${roundOne(summary.avg_speed_kmh ?? 0)} km/h` },
    { key: 'total-elevation', label: 'Total Elevation', value: `${Math.round(summary.total_elevation_m ?? 0)} m` },
    { key: 'avg-elevation', label: 'Avg Elevation', value: `${Math.round(summary.avg_elevation_m ?? 0)} m` },
    { key: 'avg-cadence', label: 'Avg Cadence', value: formatOptional(summary.avg_cadence) },
    { key: 'days-active', label: 'Days Active', value: `${summary.days_active ?? 0} days` },
  ];

  return {
    activityLabel: activityLabel(activity),
    encouragement: buildEncouragement(summary),
    metrics,
  };
}

function activityLabel(activity: ProgressActivityType): string {
  if (activity === 'walk') {
    return 'Walking';
  }

  if (activity === 'ride') {
    return 'Biking';
  }

  if (activity === 'run') {
    return 'Running';
  }

  return 'All activities';
}

function buildEncouragement(summary: ActivitySummaryResponse): string {
  const daysActive = summary.days_active ?? 0;

  if (daysActive === 0) {
    return 'No activities logged for this range yet.';
  }

  if (daysActive < 3) {
    return 'Nice start—keep adding activities to build momentum.';
  }

  return 'Great consistency across this range. Keep it going.';
}

function formatCount(value: number | undefined): string {
  return String(value ?? 0);
}

function formatDistance(value: number | undefined): string {
  return `${roundOne(value ?? 0)} km`;
}

function formatOptional(value: number | null | undefined): string {
  return value ? String(Math.round(value)) : '-';
}

function formatDuration(seconds: number | undefined): string {
  const total = Math.max(seconds ?? 0, 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
