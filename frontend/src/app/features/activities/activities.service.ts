import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { ActivityDateGroup, ActivityItem } from './activities.model';

interface StravaActivity {
  id?: number;
  name?: string;
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  average_speed?: number;
  start_date?: string;
  start_date_local?: string;
  sport_type?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/activities`;

  getActivityGroups(range: DateRange, activityType: ProgressActivityType): Observable<readonly ActivityDateGroup[]> {
    const token = this.authService.getToken();

    if (!token) {
      return throwError(() => new Error('User is not authenticated.'));
    }

    const params = new HttpParams()
      .set('after', formatDate(range.start))
      .set('before', formatDate(addDays(range.end, 1)))
      .set('page', 1)
      .set('per_page', 200);

    return this.http
      .get<StravaActivity[]>(this.apiUrl, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        params,
      })
      .pipe(
        map((activities) => activities.map(toActivityItem).filter((activity) => activity !== null)),
        map((activities) => filterActivitiesByRange(activities, range)),
        map((activities) => groupActivities(filterActivities(activities, activityType))),
      );
  }
}

function toActivityItem(activity: StravaActivity): ActivityItem | null {
  const dateValue = activity.start_date_local ?? activity.start_date;
  const date = dateValue ? new Date(dateValue) : null;
  const activityType = normalizeActivityType(activity);

  if (!date || !activityType) {
    return null;
  }

  const distanceKm = roundOne((activity.distance ?? 0) / 1000);
  const movingTimeSeconds = activity.moving_time ?? 0;
  const averageSpeed = activity.average_speed ?? speedFromDistance(distanceKm, movingTimeSeconds);

  return {
    id: String(activity.id ?? `${activity.name ?? 'activity'}-${date.toISOString()}`),
    name: activity.name ?? defaultActivityName(activityType),
    activityType,
    date,
    distanceKm,
    movingTimeSeconds,
    paceLabel: formatPace(distanceKm, movingTimeSeconds),
    speedLabel: `${roundOne(averageSpeed * 3.6)} km/h`,
    elevationM: Math.round(activity.total_elevation_gain ?? 0),
  };
}

function normalizeActivityType(activity: StravaActivity): ActivityItem['activityType'] | null {
  const normalized = (activity.sport_type ?? activity.type ?? '').toLowerCase();

  if (normalized.includes('walk')) {
    return 'walk';
  }

  if (normalized.includes('run')) {
    return 'run';
  }

  if (normalized.includes('ride') || normalized.includes('bike') || normalized.includes('cycling')) {
    return 'ride';
  }

  return null;
}

function filterActivities(
  activities: readonly ActivityItem[],
  activityType: ProgressActivityType,
): readonly ActivityItem[] {
  if (activityType === 'all') {
    return activities;
  }

  return activities.filter((activity) => activity.activityType === activityType);
}

function filterActivitiesByRange(activities: readonly ActivityItem[], range: DateRange): readonly ActivityItem[] {
  const start = startOfDay(range.start).getTime();
  const end = startOfDay(range.end).getTime();

  return activities.filter((activity) => {
    const value = startOfDay(activity.date).getTime();
    return value >= start && value <= end;
  });
}

function groupActivities(activities: readonly ActivityItem[]): readonly ActivityDateGroup[] {
  const sorted = [...activities].sort((first, second) => first.date.getTime() - second.date.getTime());
  const groups = new Map<string, ActivityItem[]>();

  for (const activity of sorted) {
    const key = formatDate(activity.date);
    const items = groups.get(key) ?? [];
    items.push(activity);
    groups.set(key, items);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: formatGroupDate(items[0]?.date ?? new Date(key)),
    activities: items,
  }));
}

function defaultActivityName(activityType: ActivityItem['activityType']): string {
  if (activityType === 'ride') {
    return 'Bike Activity';
  }

  if (activityType === 'run') {
    return 'Running Activity';
  }

  return 'Walking Activity';
}

function formatPace(distanceKm: number, movingTimeSeconds: number): string {
  if (distanceKm <= 0 || movingTimeSeconds <= 0) {
    return '-';
  }

  const totalSeconds = Math.round(movingTimeSeconds / distanceKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}/km`;
}

function speedFromDistance(distanceKm: number, movingTimeSeconds: number): number {
  return movingTimeSeconds > 0 ? (distanceKm * 1000) / movingTimeSeconds : 0;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatGroupDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
