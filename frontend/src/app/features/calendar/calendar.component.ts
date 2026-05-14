import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface DateRange {
  start: Date;
  end: Date;
}

type DateRangePreset = 'week' | 'month' | 'last30' | 'custom';

interface PresetOption {
  key: DateRangePreset;
  label: string;
}

interface CalendarCell {
  key: string;
  date: Date | null;
  label: string;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

const PRESETS: readonly PresetOption[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' },
];

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent {
  readonly range = input.required<DateRange>();
  readonly rangeChange = output<DateRange>();

  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly presets = PRESETS;
  readonly viewDate = signal(startOfMonth(new Date()));
  readonly selectedPreset = signal<DateRangePreset>('last30');
  readonly pendingStart = signal<Date | null>(null);

  readonly calendarCells = computed(() => buildCalendarCells(this.viewDate()));
  readonly monthLabel = computed(() => formatMonth(this.viewDate()));
  readonly rangeLabel = computed(() => formatDateRange(this.range()));
  readonly assistiveRangeLabel = computed(() => {
    const range = this.range();
    const prefix = sameDay(range.start, range.end) ? 'Selected day' : 'Selected date range';

    return `${prefix}: ${formatDateRange(range)}.`;
  });

  selectPreviousMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  selectNextMonth(): void {
    this.viewDate.update((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  }

  selectDay(day: Date): void {
    const selectedDay = startOfDay(day);
    const start = this.pendingStart();

    this.selectedPreset.set('custom');

    if (!start) {
      this.pendingStart.set(selectedDay);
      this.emitRange(selectedDay, selectedDay);
      return;
    }

    const ordered = orderRange(start, selectedDay);
    this.pendingStart.set(null);
    this.emitRange(ordered.start, ordered.end);
  }

  selectPreset(preset: DateRangePreset): void {
    this.selectedPreset.set(preset);
    this.pendingStart.set(null);

    if (preset === 'custom') {
      return;
    }

    const today = startOfDay(new Date());
    this.viewDate.set(startOfMonth(today));

    if (preset === 'week') {
      const start = startOfWeek(today);
      this.emitRange(start, today);
      return;
    }

    if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      this.emitRange(start, today);
      return;
    }

    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    this.emitRange(start, today);
  }

  isRangeEndpoint(day: Date): boolean {
    const range = this.range();

    return sameDay(day, range.start) || sameDay(day, range.end);
  }

  isInSelectedRange(day: Date): boolean {
    const range = this.range();

    return inRange(day, range.start, range.end);
  }

  isToday(day: Date): boolean {
    return sameDay(day, new Date());
  }

  isPendingStart(day: Date): boolean {
    const start = this.pendingStart();

    return start ? sameDay(start, day) : false;
  }

  dayAriaLabel(day: Date): string {
    const parts = [formatLongDate(day)];

    if (this.isRangeEndpoint(day)) {
      parts.push('selected');
    } else if (this.isInSelectedRange(day)) {
      parts.push('inside selected range');
    }

    if (this.isPendingStart(day)) {
      parts.push('range start');
    }

    return parts.join(', ');
  }

  private emitRange(start: Date, end: Date): void {
    this.rangeChange.emit(orderRange(startOfDay(start), startOfDay(end)));
  }
}

function buildCalendarCells(viewDate: Date): CalendarCell[] {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push({ key: `empty-start-${index}`, date: null, label: '' });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    cells.push({ key: date.toISOString(), date, label: String(day) });
  }

  while (cells.length < 42) {
    cells.push({ key: `empty-end-${cells.length}`, date: null, label: '' });
  }

  return cells;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());

  return start;
}

function orderRange(start: Date, end: Date): DateRange {
  return start.getTime() <= end.getTime() ? { start, end } : { start: end, end: start };
}

function sameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function inRange(day: Date, start: Date, end: Date): boolean {
  const value = startOfDay(day).getTime();
  const ordered = orderRange(startOfDay(start), startOfDay(end));

  return value >= ordered.start.getTime() && value <= ordered.end.getTime();
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateRange(range: DateRange): string {
  if (sameDay(range.start, range.end)) {
    return formatLongDate(range.start);
  }

  return `${formatLongDate(range.start)} → ${formatLongDate(range.end)}`;
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
