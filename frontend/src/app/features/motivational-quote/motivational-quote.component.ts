import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DailyQuotesResponse, MotivationalQuote } from './motivational-quote.model';

@Component({
  selector: 'app-motivational-quote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './motivational-quote.component.html',
  styleUrl: './motivational-quote.component.css',
})
export class MotivationalQuoteComponent {
  readonly response = input.required<DailyQuotesResponse>();
  readonly quote = computed<MotivationalQuote | null>(() => this.response().quotes[0] ?? null);
  readonly dateBadge = computed(() => formatQuoteDate(this.response().date));
}

interface QuoteDateBadge {
  month: string;
  day: string;
}

function formatQuoteDate(value: string): QuoteDateBadge {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { month: 'DAY', day: '--' };
  }

  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
  };
}
