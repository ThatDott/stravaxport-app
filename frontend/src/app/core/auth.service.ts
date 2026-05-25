import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface StravaToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  strava_id?: string;
}

interface StravaAuthUrl {
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly API_BASE = `${environment.apiBaseUrl}/auth`;
  private readonly TOKEN_KEY = 'strava_token';
  private readonly PREVIEW_KEY = 'stravaxport_dashboard_preview';

  readonly isAuthenticated = signal(false);
  readonly isConnecting = signal(false);
  readonly statusMessage = signal('');

  constructor() {
    this.checkAuthStatus();
  }

  async loginWithStrava(): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    this.isConnecting.set(true);
    this.statusMessage.set('Opening Strava authorization...');

    try {
      const response = await firstValueFrom(this.http.get<StravaAuthUrl>(`${this.API_BASE}/login`));

      if (response?.url) {
        window.location.href = response.url;
        return;
      }

      this.statusMessage.set('The backend did not return a Strava login URL.');
    } catch {
      this.statusMessage.set('Unable to reach the backend. Use Preview dashboard while working on the frontend.');
    } finally {
      this.isConnecting.set(false);
    }
  }

  async handleCallback(code: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<StravaToken>(`${this.API_BASE}/callback?code=${encodeURIComponent(code)}`, {}),
      );

      if (response?.access_token && this.isBrowser()) {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(response));
        localStorage.removeItem(this.PREVIEW_KEY);
        this.isAuthenticated.set(true);
      }
    } catch {
      this.statusMessage.set('Could not complete Strava login. Please try again.');
    }
  }

  enterPreviewDashboard(): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.PREVIEW_KEY, 'active');
    }

    this.isAuthenticated.set(true);
    this.statusMessage.set('');
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.PREVIEW_KEY);
    }

    this.isAuthenticated.set(false);
    this.statusMessage.set('');
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenData) {
      return null;
    }

    const parsed = parseToken(tokenData);
    return parsed?.access_token ?? null;
  }

  getStravaId(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenData) {
      return null;
    }

    const parsed = parseToken(tokenData);
    return parsed?.strava_id ?? null;
  }

  private checkAuthStatus(): void {
    if (!this.isBrowser()) {
      return;
    }

    const previewRequested = new URLSearchParams(window.location.search).get('preview') === 'dashboard';
    if (previewRequested) {
      localStorage.setItem(this.PREVIEW_KEY, 'active');
    }

    const hasToken = localStorage.getItem(this.TOKEN_KEY) !== null;
    const hasPreview = localStorage.getItem(this.PREVIEW_KEY) === 'active';
    this.isAuthenticated.set(hasToken || hasPreview);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}

function isStravaToken(value: unknown): value is StravaToken {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const token = value as Record<string, unknown>;

  return typeof token['access_token'] === 'string' && token['access_token'].length > 0;
}

function parseToken(data: string): StravaToken | null {
  try {
    const parsed: unknown = JSON.parse(data);
    return isStravaToken(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
