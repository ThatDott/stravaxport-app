export interface MotivationalQuote {
  id: number;
  text: string;
  author: string;
  category: string;
}

export interface DailyQuotesResponse {
  quotes: readonly MotivationalQuote[];
  date: string;
}
