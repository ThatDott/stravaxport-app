import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { ActivityDateGroup, ActivityItem } from './activities.model';
import { ActivitiesService, filterActivities, groupActivities } from './activities.service';

@Component({
  selector: 'app-activities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent {
  private readonly activitiesService = inject(ActivitiesService);
  private readonly initialVisibleDateGroups = 5;

  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly groups = signal<readonly ActivityDateGroup[]>([]);
  readonly allActivities = signal<readonly ActivityItem[]>([]);
  readonly isExpanded = signal(false);
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly currentPage = signal(1);
  readonly hasMorePages = signal(true);
  readonly activityLabel = computed(() => formatActivityLabel(this.activity()));
  readonly subtitle = computed(() => `Grouped by date | ${formatDateRange(this.range())}`);
  readonly visibleGroups = computed(() =>
    this.isExpanded() ? this.groups() : this.groups().slice(0, this.initialVisibleDateGroups),
  );
  readonly hasMoreGroups = computed(
    () => this.hasMorePages() || this.groups().length > this.initialVisibleDateGroups,
  );
  readonly toggleLabel = computed(() => (this.isExpanded() ? 'See less' : 'See more'));

  private requestId = 0;

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();

      queueMicrotask(() => {
        this.isExpanded.set(false);
        this.currentPage.set(1);
        this.allActivities.set([]);
        this.hasMorePages.set(true);
        void this.loadActivities(range, activity);
      });
    });
  }

  activityBadge(activity: ActivityItem): string {
    if (activity.activityType === 'ride') {
      return 'Bike';
    }

    if (activity.activityType === 'run') {
      return 'Run';
    }

    return 'Walk';
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

  toggleExpanded(): void {
    if (!this.isExpanded()) {
      this.isExpanded.set(true);
      void this.loadMore();
    } else {
      this.isExpanded.set(false);
    }
  }

  private async loadActivities(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const currentRequestId = this.requestId + 1;
    this.requestId = currentRequestId;
    this.isLoading.set(true);

    const result = await firstValueFrom(
      this.activitiesService.getActivityPages(range, activity, 1, 30),
    );

    if (currentRequestId !== this.requestId) {
      return;
    }

    this.allActivities.set(result.activities);
    this.hasMorePages.set(result.hasMore);
    this.currentPage.set(1);
    this.groups.set(groupActivities(filterActivities(result.activities, activity)));
    this.isLoading.set(false);
  }

  private async loadMore(): Promise<void> {
    if (this.isLoadingMore() || !this.hasMorePages()) {
      return;
    }

    this.isLoadingMore.set(true);

    const nextPage = this.currentPage() + 1;
    const result = await firstValueFrom(
      this.activitiesService.getActivityPages(this.range(), this.activity(), nextPage, 30),
    );

    if (result.activities.length === 0) {
      this.hasMorePages.set(false);
      this.isLoadingMore.set(false);
      return;
    }

    this.allActivities.update((prev) => [...prev, ...result.activities]);
    this.hasMorePages.set(result.hasMore);
    this.currentPage.set(nextPage);
    this.groups.set(groupActivities(filterActivities(this.allActivities(), this.activity())));
    this.isLoadingMore.set(false);
  }
}

function formatActivityLabel(activity: ProgressActivityType): string {
  if (activity === 'walk') {
    return 'Walking Activities';
  }

  if (activity === 'ride') {
    return 'Biking Activities';
  }

  if (activity === 'run') {
    return 'Running Activities';
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
