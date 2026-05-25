import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { OverviewData } from './overview.model';
import { OverviewService } from './overview.service';

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent {
  private readonly overviewService = inject(OverviewService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly overview = signal<OverviewData | null>(null);
  readonly isLoading = signal(false);
  readonly rangeLabel = computed(() => formatDateRange(this.range()));

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();

      queueMicrotask(() => {
        void this.loadOverview(range, activity);
      });
    });
  }

  private async loadOverview(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    try {
      const overview = await firstValueFrom(this.overviewService.getOverview(range, activity));
      if (currentRequestId !== this.requestId) {
        return;
      }
      this.overview.set(overview);
    } catch {
      if (currentRequestId === this.requestId) {
        this.handleAuthError();
      }
    } finally {
      if (currentRequestId === this.requestId) {
        this.isLoading.set(false);
      }
    }
  }

  private handleAuthError(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/auth-wall');
  }
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
