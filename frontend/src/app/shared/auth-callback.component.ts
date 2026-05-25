import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="callback-container" aria-labelledby="callback-title">
      <section class="callback-panel">
        <div class="spinner" aria-hidden="true"></div>
        <h1 id="callback-title">Connecting to Strava</h1>
        <p role="status">{{ statusMessage() }}</p>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }

    .callback-container {
      align-items: center;
      background: var(--background);
      color: var(--foreground);
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }

    .callback-panel {
      background: color-mix(in srgb, var(--card) 88%, transparent);
      border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      max-width: 28rem;
      padding: 2rem;
      text-align: center;
      width: 100%;
    }

    .spinner {
      animation: spin 900ms linear infinite;
      border: 4px solid color-mix(in srgb, var(--accent) 20%, transparent);
      border-radius: 999px;
      border-top-color: var(--accent);
      height: 3rem;
      margin: 0 auto 1rem;
      width: 3rem;
    }

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-size: 1.35rem;
    }

    p {
      color: var(--muted-foreground);
      line-height: 1.6;
      margin-top: 0.6rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly statusMessage = signal('Completing authorization...');

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');

    if (code) {
      await this.authService.handleCallback(code);
    } else {
      this.statusMessage.set('No Strava authorization code was returned.');
    }

    window.setTimeout(() => {
      void this.router.navigate(['/']);
    }, 500);
  }
}
