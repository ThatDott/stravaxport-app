import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly stats = signal<AverageStats>(EMPTY_AVERAGE_STATS);

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

    try {
      const stats = await firstValueFrom(this.averageStatsService.getAverageStats(range, activity));
      if (currentRequestId !== this.requestId) {
        return;
      }
      this.stats.set(stats);
    } catch {
      if (currentRequestId === this.requestId) {
        this.handleAuthError();
      }
    }
  }

  private handleAuthError(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth-wall');
  }
}
