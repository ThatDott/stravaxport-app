import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import { AverageDistanceComponent } from './average-distance/average-distance.component';
import { AverageElevationComponent } from './average-elevation/average-elevation.component';
import type { AverageStats } from './average-stats.model';
import { AverageStatsService } from './average-stats.service';
import { AverageTimeComponent } from './average-time/average-time.component';

const EMPTY_AVERAGE_STATS: AverageStats = {
  averageDistanceKm: 0,
  averageTimeMinutes: 0,
  totalElevationM: 0,
  activityCount: 0,
  elevationEquivalentPercent: 0,
};

@Component({
  selector: 'app-average-stats',
  imports: [AverageDistanceComponent, AverageElevationComponent, AverageTimeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './average-stats.component.html',
  styleUrl: './average-stats.component.css',
})
export class AverageStatsComponent {
  private readonly averageStatsService = inject(AverageStatsService);

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly stats = signal<AverageStats>(EMPTY_AVERAGE_STATS);
  readonly isLoading = signal(false);

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();

      queueMicrotask(() => {
        void this.loadStats(range, activity);
      });
    });
  }

  private async loadStats(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    const stats = await firstValueFrom(this.averageStatsService.getAverageStats(range, activity));

    if (currentRequestId !== this.requestId) {
      return;
    }

    this.stats.set(stats);
    this.isLoading.set(false);
  }
}
