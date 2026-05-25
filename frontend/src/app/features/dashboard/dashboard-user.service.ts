import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

interface UserResponse {
  strava_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export interface DashboardUserProfile {
  displayName: string;
  avatarUrl: string;
  connectionLabel: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardUserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  getUserProfile(): Observable<DashboardUserProfile> {
    const stravaId = this.authService.getStravaId();
    const token = this.authService.getToken();
    if (!token || !stravaId) {
      return throwError(() => new Error('User is not authenticated.'));
    }

    return this.http.get<UserResponse>(`${this.apiUrl}/${stravaId}`, {
      headers: new HttpHeaders({ Authorization: 'Bearer ' + token }),
    }).pipe(
      map((user) => ({
        displayName: `Athlete ${user.strava_id}`,
        avatarUrl: '/user-icon.jpg',
        connectionLabel: 'Strava connected',
      })),
    );
  }
}
