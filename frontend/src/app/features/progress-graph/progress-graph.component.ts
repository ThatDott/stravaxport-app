import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
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
  readonly progress = signal<ProgressGraphData>(EMPTY_PROGRESS);
  readonly isLoading = signal(false);

  readonly chart = computed(() => buildChart(this.progress().points));
  readonly summary = computed(() => this.progress().summary);
  readonly subtitle = computed(() => `Weekly distance - ${this.progress().points.length} weeks`);

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

function buildChart(points: readonly ProgressPoint[]): {
  areaPath: string;
  linePath: string;
  points: readonly ChartPoint[];
  yGrid: readonly number[];
} {
  const top = 10;
  const bottom = 86;
  const left = 10;
  const right = 250;
  const maxDistance = Math.max(...points.map((point) => point.distanceKm), 1);
  const chartPoints = points.map((point, index) => {
    const x = points.length === 1 ? (left + right) / 2 : left + ((right - left) / (points.length - 1)) * index;
    const y = bottom - (point.distanceKm / maxDistance) * (bottom - top);

    return {
      ...point,
      x,
      y,
      distanceLabel: `${point.distanceKm.toFixed(1)} km`,
      tooltipX: index === 0 ? 16 : index === points.length - 1 ? -16 : 0,
      tooltipY: y < 28 ? 18 : 0,
    };
  });

  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1]?.x ?? right} ${bottom} L ${chartPoints[0]?.x ?? left} ${bottom} Z`
    : '';

  return {
    areaPath,
    linePath,
    points: chartPoints,
    yGrid: [12, 36, 60, 86],
  };
}
