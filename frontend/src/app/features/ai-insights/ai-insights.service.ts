import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
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
      return throwError(() => new Error('User is not authenticated.'));
    }

    const params = new HttpParams().set('strava_id', stravaId);

    return this.http.get<AiInsightResponse>(this.apiUrl, {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + token }),
      params,
    });
  }
}
