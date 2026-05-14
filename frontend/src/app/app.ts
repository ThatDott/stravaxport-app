import { isPlatformBrowser } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from './core/auth.service';
import { AuthCallbackComponent } from './shared/auth-callback.component';
import { AuthWallComponent } from './shared/auth-wall.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthCallbackComponent, AuthWallComponent, DashboardComponent],
  template: `
    @if (isOAuthCallback()) {
      <app-auth-callback />
    } @else if (authService.isAuthenticated()) {
      <app-dashboard />
    } @else {
      <app-auth-wall />
    }
  `
})
export class App implements OnInit {
  readonly authService = inject(AuthService);
  readonly isOAuthCallback = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isOAuthCallback.set(window.location.pathname === '/auth/callback');
  }
}
