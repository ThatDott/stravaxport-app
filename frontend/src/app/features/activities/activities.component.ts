import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { ActivityDateGroup, ActivityItem } from './activities.model';
import { ActivitiesService } from './activities.service';

@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent {
  private readonly activitiesService = inject(ActivitiesService);

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly groups = signal<readonly ActivityDateGroup[]>([]);
  readonly isLoading = signal(false);
  readonly activityLabel = computed(() => formatActivityLabel(this.activity()));
  readonly subtitle = computed(() => `Grouped by date | ${formatDateRange(this.range())}`);

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();

      queueMicrotask(() => {
        void this.loadActivities(range, activity);
      });
    });
  }

  activityBadge(activity: ActivityItem): string {
    return activity.activityType === 'ride' ? 'Bike' : 'Walk';
  }

  primaryMetric(activity: ActivityItem): string {
    return `${activity.distanceKm.toFixed(1)} km`;
  }

  timeMetric(activity: ActivityItem): string {
    const minutes = Math.round(activity.movingTimeSeconds / 60);
    return `${minutes}m`;
  }

  performanceMetric(activity: ActivityItem): string {
    return activity.activityType === 'ride' ? activity.speedLabel : activity.paceLabel;
  }

  elevationMetric(activity: ActivityItem): string {
    return `${activity.elevationM} m gain`;
  }

  dateLabel(activity: ActivityItem): string {
    return activity.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private async loadActivities(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    const groups = await firstValueFrom(this.activitiesService.getActivityGroups(range, activity));

    if (currentRequestId !== this.requestId) {
      return;
    }

    this.groups.set(groups);
    this.isLoading.set(false);
  }
}

function formatActivityLabel(activity: ProgressActivityType): string {
  if (activity === 'walk') {
    return 'Walking Activities';
  }

  if (activity === 'ride') {
    return 'Biking Activities';
  }

  return 'All Activities';
}

function formatDateRange(range: DateRange): string {
  if (range.start.toDateString() === range.end.toDateString()) {
    return formatShortDate(range.start);
  }

  return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
