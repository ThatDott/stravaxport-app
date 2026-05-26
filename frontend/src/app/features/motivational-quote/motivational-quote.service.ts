import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DailyQuotesResponse } from './motivational-quote.model';

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
  private readonly apiUrl = 'http://localhost:8000/api/quotes/';

  getDailyQuotes(): Observable<DailyQuotesResponse> {
    const token = this.authService.getToken();
    const options = token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};

    return this.http
      .get<DailyQuotesResponse>(this.apiUrl, options)
      .pipe(catchError(() => of(EMPTY_DAILY_QUOTES_RESPONSE)));
  }
}
