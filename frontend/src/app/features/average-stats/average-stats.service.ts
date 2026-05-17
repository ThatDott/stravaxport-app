import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { AverageStats } from './average-stats.model';

@Injectable({
  providedIn: 'root',
})
export class AverageStatsService {
  getAverageStats(range: DateRange, activity: ProgressActivityType): Observable<AverageStats> {
    return of(createMockAverageStats(range, activity));
  }
}

function createMockAverageStats(range: DateRange, activity: ProgressActivityType): AverageStats {
  const days = Math.max(daysBetween(range.start, range.end) + 1, 1);
  const activityCount = Math.max(Math.round(days / 3), 1);
  const profile = mockProfileForActivity(activity);
  const totalDistanceKm = activityCount * profile.distanceKm;
  const totalMovingMinutes = activityCount * profile.minutes;
  const totalElevationM = Math.round(activityCount * profile.elevationM);

  return {
    averageDistanceKm: roundOne(totalDistanceKm / activityCount),
    averageTimeMinutes: Math.round(totalMovingMinutes / activityCount),
    totalElevationM,
    activityCount,
    elevationEquivalentPercent: Math.round((totalElevationM / 2954) * 100),
  };
}

function mockProfileForActivity(activity: ProgressActivityType): { distanceKm: number; minutes: number; elevationM: number } {
  if (activity === 'walk') {
    return { distanceKm: 4.9, minutes: 39, elevationM: 46 };
  }

  if (activity === 'ride') {
    return { distanceKm: 21.8, minutes: 63, elevationM: 182 };
  }

  return { distanceKm: 13.4, minutes: 54, elevationM: 125.6 };
}

function daysBetween(start: Date, end: Date): number {
  const startTime = startOfDay(start).getTime();
  const endTime = startOfDay(end).getTime();

  return Math.round((endTime - startTime) / 86_400_000);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  return next;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
