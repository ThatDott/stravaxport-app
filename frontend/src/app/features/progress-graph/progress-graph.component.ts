import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType, ProgressGraphData, ProgressPoint } from './progress-graph.model';
import { ProgressGraphService } from './progress-graph.service';

interface ChartPoint extends ProgressPoint {
  x: number;
  y: number;
  distanceLabel: string;
  tooltipX: number;
  tooltipY: number;
}

interface ChartSeries {
  key: Exclude<ProgressActivityType, 'all'>;
  label: string;
  areaPath: string;
  linePath: string;
  points: readonly ChartPoint[];
}

const EMPTY_PROGRESS: ProgressGraphData = {
  points: [],
  summary: {
    totalActivities: 0,
    totalDistanceKm: 0,
    totalMovingTimeSeconds: 0,
    totalElevationM: 0,
    rangeLabel: '',
  },
};

@Component({
  selector: 'app-progress-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-graph.component.html',
  styleUrl: './progress-graph.component.css',
})
export class ProgressGraphComponent {
  private readonly progressGraphService = inject(ProgressGraphService);

  readonly range = input.required<DateRange>();
  readonly selectedActivity = input.required<ProgressActivityType>();
  readonly activityChange = output<ProgressActivityType>();
  readonly progress = signal<ProgressGraphData>(EMPTY_PROGRESS);
  readonly isLoading = signal(false);

  readonly chart = computed(() => buildChart(this.progress().points, this.selectedActivity()));
  readonly summary = computed(() => this.progress().summary);
  readonly subtitle = computed(() => {
    const points = this.progress().points;
    const isDaily = points.some((point) => !point.label.startsWith('W'));
    return `${isDaily ? 'Daily' : 'Weekly'} distance - ${points.length} ${isDaily ? 'days' : 'weeks'}`;
  });

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.selectedActivity();

      queueMicrotask(() => {
        void this.loadProgress(range, activity);
      });
    });
  }

  formatMovingTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }

  playSummaryVideo(event: Event): void {
    const video = event.target;

    if (video instanceof HTMLVideoElement) {
      video.muted = true;
      void video.play().catch(() => undefined);
    }
  }

  toggleActivity(activity: ProgressActivityType): void {
    this.activityChange.emit(activity);
  }

  private async loadProgress(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    const progress = await firstValueFrom(this.progressGraphService.getProgress(range, activity));

    if (currentRequestId !== this.requestId) {
      return;
    }

    this.progress.set(progress);
    this.isLoading.set(false);
  }
}

function buildChart(
  points: readonly ProgressPoint[],
  activityType: ProgressActivityType,
): {
  series: readonly ChartSeries[];
  labels: readonly ChartPoint[];
  yGrid: readonly number[];
} {
  const top = 10;
  const bottom = 86;
  const left = 10;
  const right = 250;
  const seriesKeys: Array<Exclude<ProgressActivityType, 'all'>> =
    activityType === 'all' ? ['walk', 'ride', 'run'] : [activityType];
  const visibleKeys = seriesKeys.filter((key) => points.some((point) => getSeriesDistance(point, key) > 0));
  const maxDistance = Math.max(
    ...visibleKeys.flatMap((key) => points.map((point) => getSeriesDistance(point, key))),
    1,
  );
  const labels = buildSeriesPoints(points, 'walk', maxDistance, top, bottom, left, right);
  const series = visibleKeys.map((key) => {
    const seriesPoints = buildSeriesPoints(points, key, maxDistance, top, bottom, left, right);
    const linePath =
      seriesPoints.length === 1
        ? `M ${left} ${seriesPoints[0].y} L ${right} ${seriesPoints[0].y}`
        : seriesPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = seriesPoints.length
      ? `${linePath} L ${seriesPoints.length === 1 ? right : seriesPoints[seriesPoints.length - 1]?.x ?? right} ${bottom} L ${
          seriesPoints.length === 1 ? left : seriesPoints[0]?.x ?? left
        } ${bottom} Z`
      : '';

    return {
      key,
      label: getSeriesLabel(key),
      areaPath,
      linePath,
      points: seriesPoints,
    };
  });

  return {
    series,
    labels,
    yGrid: [12, 36, 60, 86],
  };
}

function buildSeriesPoints(
  points: readonly ProgressPoint[],
  key: Exclude<ProgressActivityType, 'all'>,
  maxDistance: number,
  top: number,
  bottom: number,
  left: number,
  right: number,
): readonly ChartPoint[] {
  return points.map((point, index) => {
    const distanceKm = getSeriesDistance(point, key);
    const x = points.length === 1 ? (left + right) / 2 : left + ((right - left) / (points.length - 1)) * index;
    const y = bottom - (distanceKm / maxDistance) * (bottom - top);

    return {
      ...point,
      x,
      y,
      distanceLabel: `${distanceKm.toFixed(1)} km`,
      tooltipX: index === 0 ? 16 : index === points.length - 1 ? -16 : 0,
      tooltipY: y < 28 ? 18 : 0,
    };
  });
}

function getSeriesDistance(point: ProgressPoint, key: Exclude<ProgressActivityType, 'all'>): number {
  if (key === 'walk') {
    return point.walkDistanceKm;
  }

  if (key === 'ride') {
    return point.rideDistanceKm;
  }

  return point.runDistanceKm;
}

function getSeriesLabel(key: Exclude<ProgressActivityType, 'all'>): string {
  if (key === 'walk') {
    return 'Walking';
  }

  if (key === 'ride') {
    return 'Biking';
  }

  return 'Running';
}
