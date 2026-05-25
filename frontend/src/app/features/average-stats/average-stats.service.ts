import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import type { ActivitySummaryResponse } from '../activities/activity-summary.model';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { AverageStats } from './average-stats.model';

@Injectable({
  providedIn: 'root',
})
export class AverageStatsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/activities/summary`;

  getAverageStats(range: DateRange, activity: ProgressActivityType): Observable<AverageStats> {
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
      .pipe(map((summary) => toAverageStats(summary)));
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

function toAverageStats(summary: ActivitySummaryResponse): AverageStats {
  const totalElevationM = Math.round(summary.total_elevation_m ?? 0);

  return {
    averageDistanceKm: roundOne(summary.avg_distance_km ?? 0),
    averageTimeMinutes: Math.round(summary.avg_time_minutes ?? 0),
    totalElevationM,
    activityCount: summary.total_activities ?? 0,
    elevationEquivalentPercent: Math.round((totalElevationM / 2954) * 100),
  };
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
