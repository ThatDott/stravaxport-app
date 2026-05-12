import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

interface StravaToken {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly API_BASE = 'http://localhost:8000/auth';
  private readonly TOKEN_KEY = 'strava_token';

  isAuthenticated = signal(false);

  constructor() {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      this.isAuthenticated.set(!!token);
    }
  }

  async handleCallback(code: string): Promise<void> {
    console.log('Handling callback with code:', code);
    try {
      const response = await firstValueFrom(this.http.post<StravaToken>(`${this.API_BASE}/callback?code=${code}`, {}));
      console.log('Token response:', response);
      if (response?.access_token && isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(response));
        this.isAuthenticated.set(true);
        console.log('Token saved, authenticated:', this.isAuthenticated());
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  }

  async loginWithStrava(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<{ url: string }>(`${this.API_BASE}/login`));
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.access_token;
    }
    return null;
  }
}
