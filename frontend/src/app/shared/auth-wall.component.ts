import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth-wall',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-wall">
      <div class="auth-container">
        <h1>StravaXport</h1>
        <p>Transform your Strava activities into shareable social content</p>
        
        @if (!authService.isAuthenticated()) {
          <button 
            class="strava-connect-btn"
            (click)="connectToStrava()"
            type="button"
            aria-label="Connect to Strava to access your activities">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172"/>
            </svg>
            Connect to Strava
          </button>
        } @else {
          <div class="connected-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span>Connected to Strava</span>
            <button 
              class="disconnect-btn"
              (click)="disconnect()"
              type="button"
              aria-label="Disconnect from Strava">
              Disconnect
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wall {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #fc4c02 0%, #e34402 100%);
      color: white;
    }
    
    .auth-container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    
    p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .strava-connect-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      color: #fc4c02;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .strava-connect-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }
    
    .strava-connect-btn:focus {
      outline: 2px solid white;
      outline-offset: 2px;
    }
    
    .connected-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .connected-state svg {
      color: #4caf50;
    }
    
    .connected-state span {
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .disconnect-btn {
      background: transparent;
      color: white;
      border: 2px solid white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .disconnect-btn:hover {
      background: white;
      color: #fc4c02;
    }
    
    .disconnect-btn:focus {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  `]
})
export class AuthWallComponent {
  authService = inject(AuthService);
  
  connectToStrava(): void {
    this.authService.loginWithStrava();
  }
  
  disconnect(): void {
    this.authService.logout();
  }
}
