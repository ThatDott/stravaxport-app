import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';

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

export interface OverviewData {
  activityLabel: string;
  encouragement: string;
  metrics: readonly OverviewMetric[];
}

type StravaActivitySummary = {
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
  avg_cadence?: number;
  days_active: number;
};

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();

  readonly overview = signal<OverviewData>({
    activityLabel: 'All activities',
    encouragement: '',
    metrics: [],
  });
  readonly isLoading = signal(false);

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();

      this.overview.set(emptyOverview(activity, range));

      queueMicrotask(() => {
        void this.loadOverview(range, activity);
      });
    });
  }

  readonly rangeLabel = computed(() => formatDateRange(this.range()));

  private async loadOverview(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    const token = this.authService.getToken();
    if (!token) {
      this.overview.set(emptyOverview(activity, range));
      this.isLoading.set(false);
      return;
    }

    try {
      const after = formatApiDate(range.start);
      const before = formatApiDate(addDays(range.end, 1));

      const activityParam = activity !== 'all' ? `&activity_type=${activity}` : '';
      const summary = await firstValueFrom(
        this.http.get<StravaActivitySummary>(
          `http://localhost:8000/api/activities/summary?after=${after}&before=${before}${activityParam}`,
          { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) },
        ),
      );

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.overview.set(buildOverviewFromSummary(summary, activity));
      this.isLoading.set(false);
    } catch {
      if (currentRequestId !== this.requestId) {
        return;
      }

      this.overview.set(emptyOverview(activity, range));
      this.isLoading.set(false);
    }
  }
}

function buildOverviewFromSummary(summary: StravaActivitySummary, activity: ProgressActivityType): OverviewData {
  const label = activityLabel(activity);

  const metrics: OverviewMetric[] = [
    { key: 'activities', label: 'Total Activities', value: String(summary.total_activities) },
    { key: 'distance', label: 'Total Distance', value: `${summary.total_distance_km.toFixed(1)} km` },
    { key: 'moving-time', label: 'Moving Time', value: summary.formatted_moving_time },
    { key: 'avg-distance', label: 'Avg Distance', value: `${summary.avg_distance_km.toFixed(1)} km` },
    { key: 'avg-time', label: 'Avg Time', value: `${summary.avg_time_minutes.toFixed(0)} min` },
    { key: 'avg-pace', label: 'Avg Pace', value: summary.avg_pace_formatted },
    { key: 'avg-speed', label: 'Avg Speed', value: `${summary.avg_speed_kmh.toFixed(1)} km/h` },
    { key: 'total-elevation', label: 'Total Elevation', value: `${Math.round(summary.total_elevation_m)} m` },
    { key: 'avg-elevation', label: 'Avg Elevation', value: `${Math.round(summary.avg_elevation_m)} m` },
    ...(summary.avg_cadence != null ? [{ key: 'avg-cadence' as OverviewMetricKey, label: 'Avg Cadence', value: String(Math.round(summary.avg_cadence)) }] : []),
    { key: 'days-active', label: 'Days Active', value: `${summary.days_active} days` },
  ];

  return {
    activityLabel: label,
    encouragement: encouragementForActivity(activity, summary.total_activities),
    metrics,
  };
}

function emptyOverview(activity: ProgressActivityType, range: DateRange): OverviewData {
  return {
    activityLabel: activityLabel(activity),
    encouragement: 'No activities found for this date range. Try adjusting the filters.',
    metrics: [
      { key: 'activities', label: 'Total Activities', value: '0' },
      { key: 'distance', label: 'Total Distance', value: '0 km' },
      { key: 'moving-time', label: 'Moving Time', value: '0h 0m' },
      { key: 'avg-distance', label: 'Avg Distance', value: '0 km' },
      { key: 'avg-time', label: 'Avg Time', value: '0 min' },
      { key: 'avg-pace', label: 'Avg Pace', value: '-' },
      { key: 'avg-speed', label: 'Avg Speed', value: '0 km/h' },
      { key: 'total-elevation', label: 'Total Elevation', value: '0 m' },
      { key: 'avg-elevation', label: 'Avg Elevation', value: '0 m' },
      { key: 'avg-cadence', label: 'Avg Cadence', value: '-' },
      { key: 'days-active', label: 'Days Active', value: '0 days' },
    ],
  };
}

function encouragementForActivity(activity: ProgressActivityType, total: number): string {
  if (total === 0) {
    return 'Time to log your first activity!';
  }

  switch (activity) {
    case 'walk':
      return `You’ve logged ${total} walks. Keep moving!`;
    case 'ride':
      return `You’ve got ${total} bike rides. Great pedalling!`;
    case 'run':
      return `You’ve done ${total} runs. Terrific pace!`;
    default:
      return `You’ve completed ${total} activities. Well done!`;
  }
}

function activityLabel(activity: ProgressActivityType): string {
  switch (activity) {
    case 'walk':
      return 'Walking';
    case 'ride':
      return 'Biking';
    case 'run':
      return 'Running';
    default:
      return 'All activities';
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

function formatDateRange(range: DateRange): string {
  if (sameDay(range.start, range.end)) {
    return formatShortDate(range.start);
  }

  return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
}

function sameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
