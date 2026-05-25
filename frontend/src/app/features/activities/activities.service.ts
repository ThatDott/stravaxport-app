import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
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
      return of(groupActivities(filterActivities(filterActivitiesByRange(createMockActivities(range), range), activityType)));
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
        catchError(() => of(groupActivities(filterActivities(filterActivitiesByRange(createMockActivities(range), range), activityType)))),
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

function createMockActivities(range: DateRange): readonly ActivityItem[] {
  const end = startOfDay(range.end);
  const dates = [0, 1, 2, 3, 5, 7, 9, 10, 12].map((offset) => addDays(end, -offset));
  const seed: Array<Omit<ActivityItem, 'date'>> = [
    {
      id: 'walk-1',
      name: 'Morning Walk',
      activityType: 'walk',
      distanceKm: 5.2,
      movingTimeSeconds: 32 * 60,
      paceLabel: '6:09/km',
      speedLabel: '9.8 km/h',
      elevationM: 42,
    },
    {
      id: 'ride-1',
      name: 'Sunset Ride',
      activityType: 'ride',
      distanceKm: 18.4,
      movingTimeSeconds: 57 * 60,
      paceLabel: '-',
      speedLabel: '19.3 km/h',
      elevationM: 180,
    },
    {
      id: 'run-1',
      name: 'Steady Run',
      activityType: 'run',
      distanceKm: 6.4,
      movingTimeSeconds: 38 * 60,
      paceLabel: '5:56/km',
      speedLabel: '10.1 km/h',
      elevationM: 54,
    },
    {
      id: 'walk-2',
      name: 'Easy Walk',
      activityType: 'walk',
      distanceKm: 4.8,
      movingTimeSeconds: 29 * 60,
      paceLabel: '6:03/km',
      speedLabel: '9.9 km/h',
      elevationM: 28,
    },
    {
      id: 'run-2',
      name: 'Tempo Run',
      activityType: 'run',
      distanceKm: 5.8,
      movingTimeSeconds: 31 * 60,
      paceLabel: '5:21/km',
      speedLabel: '11.2 km/h',
      elevationM: 46,
    },
    {
      id: 'ride-2',
      name: 'Tempo Bike',
      activityType: 'ride',
      distanceKm: 22.1,
      movingTimeSeconds: 68 * 60,
      paceLabel: '-',
      speedLabel: '19.5 km/h',
      elevationM: 210,
    },
    {
      id: 'walk-3',
      name: 'Lunch Walk',
      activityType: 'walk',
      distanceKm: 3.1,
      movingTimeSeconds: 24 * 60,
      paceLabel: '7:44/km',
      speedLabel: '7.8 km/h',
      elevationM: 18,
    },
    {
      id: 'run-3',
      name: 'Recovery Run',
      activityType: 'run',
      distanceKm: 4.2,
      movingTimeSeconds: 27 * 60,
      paceLabel: '6:26/km',
      speedLabel: '9.3 km/h',
      elevationM: 22,
    },
    {
      id: 'ride-3',
      name: 'Recovery Bike',
      activityType: 'ride',
      distanceKm: 12.6,
      movingTimeSeconds: 45 * 60,
      paceLabel: '-',
      speedLabel: '16.8 km/h',
      elevationM: 95,
    },
  ];

  return seed.map((activity, index) => ({
    ...activity,
    date: dates[index] ?? end,
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
