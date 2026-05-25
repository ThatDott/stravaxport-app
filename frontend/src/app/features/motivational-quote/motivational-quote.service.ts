import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import type { DailyQuotesResponse } from './motivational-quote.model';

@Injectable({
  providedIn: 'root',
})
export class MotivationalQuoteService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/quotes/daily`;

  getDailyQuotes(): Observable<DailyQuotesResponse> {
    const token = this.authService.getToken();
    if (!token) {
      return throwError(() => new Error('User is not authenticated.'));
    }

    return this.http
      .get<DailyQuotesResponse>(this.apiUrl, {
        headers: new HttpHeaders({ Authorization: 'Bearer ' + token }),
      })
      .pipe(
        map((response) => withQuoteFallback(response)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(defaultDailyQuote());
          }
          return throwError(() => error);
        }),
      );
  }
}

function withQuoteFallback(response: DailyQuotesResponse): DailyQuotesResponse {
  if (response.quotes.length > 0) {
    return response;
  }

  return {
    ...response,
    quotes: defaultDailyQuote().quotes,
  };
}

function defaultDailyQuote(): DailyQuotesResponse {
  return {
    date: new Date().toISOString(),
    quotes: [
      {
        id: 0,
        text: 'Every mile is progress.',
        author: 'StravaXport',
        category: 'motivation',
      },
    ],
  };
}
