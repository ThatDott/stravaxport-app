import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callback-container">
      <div class="loading">
        <div class="spinner" aria-hidden="true"></div>
        <p>Connecting to Strava...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #fc4c02 0%, #e34402 100%);
      color: white;
    }
    
    .loading {
      text-align: center;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    p {
      font-size: 1.1rem;
      margin: 0;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.queryParams['code'];
    
    if (code) {
      await this.authService.handleCallback(code);
      // Small delay to ensure localStorage is written
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 100);
    } else {
      this.router.navigate(['/']);
    }
  }
}
