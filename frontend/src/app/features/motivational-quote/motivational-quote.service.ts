import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DailyQuotesResponse, MotivationalQuote } from './motivational-quote.model';

const EMPTY_DAILY_QUOTES_RESPONSE: DailyQuotesResponse = {
  quotes: [],
  date: new Date().toISOString(),
};

@Injectable({
  providedIn: 'root',
})
export class MotivationalQuoteService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/api/quotes/daily';

  getDailyQuotes(): Observable<DailyQuotesResponse> {
    const token = this.authService.getToken();
    const options = token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};

    return this.http
      .get<{ quote: string; author: string }>(this.apiUrl, options)
      .pipe(
        map((response) => ({
          date: new Date().toISOString(),
          quotes: [
            {
              id: 1,
              text: response.quote,
              author: response.author,
              category: 'motivation',
            },
          ] as readonly MotivationalQuote[],
        })),
        catchError(() => of(EMPTY_DAILY_QUOTES_RESPONSE)),
      );
  }
}
