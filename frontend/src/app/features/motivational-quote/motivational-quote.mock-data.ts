import type { DailyQuotesResponse } from './motivational-quote.model';

export const MOCK_DAILY_QUOTES_RESPONSE: DailyQuotesResponse = {
  date: new Date().toISOString(),
  quotes: [
    {
      id: 1,
      text: '"Success is the sum of small efforts, repeated day-in and day-out."',
      author: '— Robert Collier',
      category: 'motivation',
    },
  ],
};
