import type { DailyQuotesResponse } from './motivational-quote.model';

export const MOCK_DAILY_QUOTES_RESPONSE: DailyQuotesResponse = {
  date: new Date().toISOString(),
  quotes: [
    {
      id: 1,
      text: 'Progress is built one step at a time.',
      author: 'Daily mantra',
      category: 'motivation',
    },
  ],
};
