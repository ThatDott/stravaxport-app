import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { AuthService } from './core/auth.service';
import { AuthWallComponent } from './shared/auth-wall.component';
import { DashboardComponent } from './features/dashboard.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthWallComponent, DashboardComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <app-dashboard />
    } @else {
      <app-auth-wall />
    }
  `
})
export class App implements OnInit {
  authService = inject(AuthService);
  
  ngOnInit(): void {
    // Handle callback directly in app component
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code) {
      console.log('Found code in URL:', code);
      this.authService.handleCallback(code).then(() => {
        // Clean URL after processing
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    } else if (error) {
      console.log('User cancelled or error occurred:', error);
      // Clean URL and stay on auth wall
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}
