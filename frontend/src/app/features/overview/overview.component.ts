import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DateRange } from '../calendar/calendar.component';
import { MOCK_OVERVIEW_DATA } from './overview.mock-data';

@Component({
  selector: 'app-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent {
  readonly range = input.required<DateRange>();
  readonly overview = MOCK_OVERVIEW_DATA;
  readonly rangeLabel = computed(() => formatDateRange(this.range()));
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
