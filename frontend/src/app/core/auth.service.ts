import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface StravaToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  strava_id?: string;
}

interface StravaAuthUrl {
  url: string;
}

interface StravaProfile {
  name: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly API_BASE = 'http://localhost:8000/api/auth';
  private readonly TOKEN_KEY = 'strava_token';

  readonly isAuthenticated = signal(false);
  readonly isConnecting = signal(false);
  readonly statusMessage = signal('');

  readonly userName = signal('');
  readonly userAvatar = signal('');

  constructor() {
    this.checkAuthStatus();

    if (this.isAuthenticated()) {
      void this.fetchProfile();
    }
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
      this.statusMessage.set('Backend is not running on port 8000. Use Preview dashboard while working on the frontend.');
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
        this.isAuthenticated.set(true);
      }
    } catch {
      this.statusMessage.set('Could not complete Strava login. Please try again.');
    }
  }

  async fetchProfile(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return;
    }

    try {
      const profile = await firstValueFrom(
        this.http.get<StravaProfile>(`${this.API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      this.userName.set(profile.name);
      this.userAvatar.set(profile.avatar);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (this.isBrowser()) {
          localStorage.removeItem(this.TOKEN_KEY);
        }
        this.isAuthenticated.set(false);
        this.userName.set('');
        this.userAvatar.set('');
        this.statusMessage.set('Session expired. Please login again.');
      }
    }
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.TOKEN_KEY);
    }

    this.isAuthenticated.set(false);
    this.statusMessage.set('');
    this.userName.set('');
    this.userAvatar.set('');
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenData) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(tokenData);

      return isStravaToken(parsed) ? parsed.access_token : null;
    } catch {
      return null;
    }
  }

  getStravaId(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenData) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(tokenData);
      if (typeof parsed === 'object' && parsed !== null) {
        const token = parsed as Record<string, unknown>;
        return typeof token['strava_id'] === 'string' ? token['strava_id'] : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private checkAuthStatus(): void {
    if (!this.isBrowser()) {
      return;
    }

    const hasToken = localStorage.getItem(this.TOKEN_KEY) !== null;
    this.isAuthenticated.set(hasToken);
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
