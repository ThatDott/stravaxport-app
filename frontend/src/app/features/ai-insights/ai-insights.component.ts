import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DateRange } from '../calendar/calendar.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { AiInsightResponse } from './ai-insights.model';

@Component({
  selector: 'app-ai-insights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-insights.component.html',
  styleUrl: './ai-insights.component.css',
})
export class AiInsightsComponent {
  readonly response = input.required<AiInsightResponse>();
  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly isLoading = input(false);

  readonly insightList = computed(() => this.response().insights);
  readonly geoNote = computed(() => this.response().geo_comparison);
  readonly hasInsights = computed(() => this.insightList().length > 0);
  readonly isErrorState = computed(() =>
    this.insightList().length === 1 &&
    this.insightList()[0].startsWith("We couldn't generate your insights right now."),
  );
  readonly rangeLabel = computed(() => formatDateRange(this.range()));
}

function formatDateRange(range: DateRange): string {
  if (sameDay(range.start, range.end)) {
    return formatLongDate(range.start);
  }

  return `${formatLongDate(range.start)} → ${formatLongDate(range.end)}`;
}

function sameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
