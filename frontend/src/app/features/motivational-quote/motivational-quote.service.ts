import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { MOCK_DAILY_QUOTES_RESPONSE } from './motivational-quote.mock-data';
import type { DailyQuotesResponse } from './motivational-quote.model';

@Injectable({
  providedIn: 'root',
})
export class MotivationalQuoteService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8000/quotes/';

  getDailyQuotes(): Observable<DailyQuotesResponse> {
    const token = this.authService.getToken();
    const options = token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};

    return this.http
      .get<DailyQuotesResponse>(this.apiUrl, options)
      .pipe(catchError(() => of(MOCK_DAILY_QUOTES_RESPONSE)));
  }
}
