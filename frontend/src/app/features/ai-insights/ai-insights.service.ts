import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { MOCK_AI_INSIGHTS_RESPONSE } from './ai-insights.mock-data';
import type { AiInsightResponse } from './ai-insights.model';

@Injectable({
  providedIn: 'root',
})
export class AiInsightsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/insights`;

  getInsights(): Observable<AiInsightResponse> {
    const token = this.authService.getToken();
    const stravaId = this.authService.getStravaId();

    if (!token || !stravaId) {
      return of(MOCK_AI_INSIGHTS_RESPONSE);
    }

    const params = new HttpParams().set('strava_id', stravaId);

    return this.http
      .get<AiInsightResponse>(this.apiUrl, {
        headers: new HttpHeaders({ Authorization: 'Bearer ' + token }),
        params,
      })
      .pipe(catchError(() => of(MOCK_AI_INSIGHTS_RESPONSE)));
  }
}
