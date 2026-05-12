import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>StravaXport Dashboard</h1>
        <button 
          class="logout-btn"
          (click)="logout()"
          type="button"
          aria-label="Logout from StravaXport">
          Logout
        </button>
      </header>
      
      <main class="dashboard-content">
        <div class="welcome-card">
          <h2>Welcome to StravaXport!</h2>
          <p>Your Strava account is connected. Start creating amazing social content from your activities.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f5f5f5;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .dashboard-header h1 {
      color: #fc4c02;
      margin: 0;
      font-size: 1.5rem;
    }
    
    .logout-btn {
      background: #fc4c02;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    
    .logout-btn:hover {
      background: #e34402;
    }
    
    .logout-btn:focus {
      outline: 2px solid #fc4c02;
      outline-offset: 2px;
    }
    
    .dashboard-content {
      padding: 2rem;
    }
    
    .welcome-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    
    .welcome-card h2 {
      color: #333;
      margin-bottom: 1rem;
    }
    
    .welcome-card p {
      color: #666;
      line-height: 1.6;
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  
  logout(): void {
    this.authService.logout();
  }
}
