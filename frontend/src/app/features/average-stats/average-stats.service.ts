import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { AverageStats } from './average-stats.model';

interface SummaryResponse {
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
  days_active: number;
}

const EMPTY_STATS: AverageStats = {
  averageDistanceKm: 0,
  averageTimeMinutes: 0,
  totalElevationM: 0,
  activityCount: 0,
  elevationEquivalentPercent: 0,
};

@Injectable({
  providedIn: 'root',
})
export class AverageStatsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api/activities';

  getAverageStats(range: DateRange, activity: ProgressActivityType): Observable<AverageStats> {
    const token = this.authService.getToken();

    if (!token) {
      return of(EMPTY_STATS);
    }

    const params = new HttpParams()
      .set('after', formatApiDate(range.start))
      .set('before', formatApiDate(addDays(range.end, 1)))
      .set('activity_type', activity);

    return this.http
      .get<SummaryResponse>(`${this.apiUrl}/summary`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        params,
      })
      .pipe(
        map((summary) => ({
          averageDistanceKm: summary.avg_distance_km,
          averageTimeMinutes: Math.round(summary.avg_time_minutes),
          totalElevationM: Math.round(summary.total_elevation_m),
          activityCount: summary.total_activities,
          elevationEquivalentPercent: Math.round((summary.total_elevation_m / 2954) * 100),
        })),
        catchError(() => of(EMPTY_STATS)),
      );
  }
}

function formatApiDate(date: Date): string {
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
