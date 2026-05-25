import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType, ProgressGraphData, ProgressPoint } from './progress-graph.model';

interface StravaActivity {
  distance?: number;
  moving_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  start_date_local?: string;
  sport_type?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProgressGraphService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/activities`;

  getProgress(range: DateRange, activityType: ProgressActivityType): Observable<ProgressGraphData> {
    const token = this.authService.getToken();

    if (!token) {
      return of(createMockProgress(range, activityType));
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
        map((activities) => buildProgressData(range, activities, activityType)),
        catchError(() => of(createMockProgress(range, activityType))),
      );
  }
}

function buildProgressData(
  range: DateRange,
  activities: readonly StravaActivity[],
  activityType: ProgressActivityType,
): ProgressGraphData {
  const filtered = activities.filter((activity) => matchesActivityType(activity, activityType));
  const buckets = buildBuckets(range);

  for (const activity of filtered) {
    const activityDate = parseActivityDate(activity);
    const normalizedType = normalizeActivityType(activity);
    if (!activityDate) {
      continue;
    }

    const bucket = buckets.find((item) => isWithinRange(activityDate, item.start, item.end));
    if (bucket) {
      const distanceKm = (activity.distance ?? 0) / 1000;

      if (normalizedType === 'walk') {
        bucket.walkDistanceKm += distanceKm;
      } else if (normalizedType === 'ride') {
        bucket.rideDistanceKm += distanceKm;
      } else if (normalizedType === 'run') {
        bucket.runDistanceKm += distanceKm;
      }

      bucket.distanceKm += distanceKm;
    }
  }

  return {
    points: buckets.map((bucket) => ({
      label: bucket.label,
      rangeLabel: formatRange(bucket.start, bucket.end),
      distanceKm: roundOne(bucket.distanceKm),
      walkDistanceKm: roundOne(bucket.walkDistanceKm),
      rideDistanceKm: roundOne(bucket.rideDistanceKm),
      runDistanceKm: roundOne(bucket.runDistanceKm),
    })),
    summary: {
      totalActivities: filtered.length,
      totalDistanceKm: roundOne(filtered.reduce((total, activity) => total + (activity.distance ?? 0) / 1000, 0)),
      totalMovingTimeSeconds: filtered.reduce((total, activity) => total + (activity.moving_time ?? 0), 0),
      totalElevationM: Math.round(filtered.reduce((total, activity) => total + (activity.total_elevation_gain ?? 0), 0)),
      rangeLabel: formatRange(range.start, range.end),
    },
  };
}

function createMockProgress(range: DateRange, activityType: ProgressActivityType): ProgressGraphData {
  const buckets = buildBuckets(range);
  const walkDistances = [4.8, 7.2, 6.4, 10.1, 8.8, 12.0, 13.5, 16.4];
  const rideDistances = [8.4, 11.6, 9.8, 15.2, 13.5, 18.3, 16.7, 21.1];
  const runDistances = [3.2, 5.4, 4.7, 6.1, 5.8, 7.2, 6.6, 8.4];
  const distancesByActivity: Record<ProgressActivityType, readonly number[]> = {
    all: walkDistances.map((distance, index) => distance + (rideDistances[index] ?? 0) + (runDistances[index] ?? 0)),
    walk: walkDistances,
    ride: rideDistances,
    run: runDistances,
  };
  const distances = distancesByActivity[activityType];
  const points: ProgressPoint[] = buckets.map((bucket, index) => ({
    label: bucket.label,
    rangeLabel: formatRange(bucket.start, bucket.end),
    distanceKm: roundOne(distances[index % distances.length] ?? 0),
    walkDistanceKm:
      activityType === 'ride' || activityType === 'run' ? 0 : roundOne(walkDistances[index % walkDistances.length] ?? 0),
    rideDistanceKm:
      activityType === 'walk' || activityType === 'run' ? 0 : roundOne(rideDistances[index % rideDistances.length] ?? 0),
    runDistanceKm:
      activityType === 'walk' || activityType === 'ride' ? 0 : roundOne(runDistances[index % runDistances.length] ?? 0),
  }));
  const totalDistanceKm = roundOne(points.reduce((total, point) => total + getPointDistance(point, activityType), 0));

  return {
    points,
    summary: {
      totalActivities: Math.max(1, points.length * (activityType === 'all' ? 3 : 1)),
      totalDistanceKm,
      totalMovingTimeSeconds: Math.round(totalDistanceKm * (activityType === 'ride' ? 190 : activityType === 'run' ? 360 : 720)),
      totalElevationM: Math.round(totalDistanceKm * (activityType === 'ride' ? 5.2 : activityType === 'run' ? 3.8 : 2.4)),
      rangeLabel: formatRange(range.start, range.end),
    },
  };
}

function buildBuckets(
  range: DateRange,
): Array<{
  label: string;
  start: Date;
  end: Date;
  distanceKm: number;
  walkDistanceKm: number;
  rideDistanceKm: number;
  runDistanceKm: number;
}> {
  return getInclusiveDayCount(range) <= 7 ? buildDayBuckets(range) : buildWeekBuckets(range);
}

function buildWeekBuckets(
  range: DateRange,
): Array<{
  label: string;
  start: Date;
  end: Date;
  distanceKm: number;
  walkDistanceKm: number;
  rideDistanceKm: number;
  runDistanceKm: number;
}> {
  const start = startOfDay(range.start);
  const rangeEnd = startOfDay(range.end);
  const buckets: Array<{
    label: string;
    start: Date;
    end: Date;
    distanceKm: number;
    walkDistanceKm: number;
    rideDistanceKm: number;
    runDistanceKm: number;
  }> = [];
  let cursor = start;
  let index = 1;

  while (cursor.getTime() <= rangeEnd.getTime()) {
    const end = minDate(addDays(cursor, 6), rangeEnd);
    buckets.push(createBucket(`W${index}`, cursor, end));
    cursor = addDays(end, 1);
    index += 1;
  }

  return buckets;
}

function buildDayBuckets(range: DateRange): ReturnType<typeof buildWeekBuckets> {
  const start = startOfDay(range.start);
  const dayCount = getInclusiveDayCount(range);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(start, index);
    return createBucket(formatDayLabel(date), date, date);
  });
}

function createBucket(label: string, start: Date, end: Date): ReturnType<typeof buildWeekBuckets>[number] {
  return { label, start, end, distanceKm: 0, walkDistanceKm: 0, rideDistanceKm: 0, runDistanceKm: 0 };
}

function matchesActivityType(activity: StravaActivity, activityType: ProgressActivityType): boolean {
  if (activityType === 'all') {
    return true;
  }

  return normalizeActivityType(activity) === activityType;
}

function normalizeActivityType(activity: StravaActivity): Exclude<ProgressActivityType, 'all'> | null {
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

function parseActivityDate(activity: StravaActivity): Date | null {
  const value = activity.start_date_local ?? activity.start_date;
  return value ? startOfDay(new Date(value)) : null;
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const value = date.getTime();
  return value >= start.getTime() && value <= end.getTime();
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

function getInclusiveDayCount(range: DateRange): number {
  const start = startOfDay(range.start).getTime();
  const end = startOfDay(range.end).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

function getPointDistance(point: ProgressPoint, activityType: ProgressActivityType): number {
  if (activityType === 'walk') {
    return point.walkDistanceKm;
  }

  if (activityType === 'ride') {
    return point.rideDistanceKm;
  }

  if (activityType === 'run') {
    return point.runDistanceKm;
  }

  return point.distanceKm;
}

function minDate(first: Date, second: Date): Date {
  return first.getTime() <= second.getTime() ? first : second;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRange(start: Date, end: Date): string {
  if (start.toDateString() === end.toDateString()) {
    return formatShortDate(start);
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function formatDayLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return `${weekday} ${date.getDate()}`;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
