import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth-wall',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-wall" aria-labelledby="auth-title">
      <section class="auth-panel">
        <p class="eyebrow">StravaXport</p>
        <h1 id="auth-title">Connect your Strava account</h1>
        <p class="intro">Use Strava when the backend is running, or preview the dashboard while building the frontend.</p>

        <button
          class="primary-action"
          type="button"
          [disabled]="authService.isConnecting()"
          (click)="connectToStrava()"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.172" />
          </svg>
          @if (authService.isConnecting()) {
            Opening Strava
          } @else {
            Connect to Strava
          }
        </button>

        <button class="secondary-action" type="button" (click)="previewDashboard()">
          Preview dashboard
        </button>

        @if (authService.statusMessage()) {
          <p class="status-message" role="status">{{ authService.statusMessage() }}</p>
        }
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }

    .auth-wall {
      align-items: center;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--primary) 22%, transparent), transparent 38%),
        var(--background);
      color: var(--foreground);
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }

    .auth-panel {
      background: color-mix(in srgb, var(--card) 88%, transparent);
      border: 1px solid color-mix(in srgb, var(--border) 88%, transparent);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      max-width: 30rem;
      padding: clamp(1.5rem, 4vw, 2.4rem);
      width: 100%;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 0.78rem;
      font-weight: 750;
      letter-spacing: 0.28em;
      margin: 0 0 0.8rem;
      text-transform: uppercase;
    }

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.05;
    }

    .intro,
    .status-message {
      color: var(--muted-foreground);
      font-size: 1rem;
      line-height: 1.65;
      margin-top: 1rem;
    }

    .primary-action,
    .secondary-action {
      align-items: center;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      font-weight: 750;
      gap: 0.6rem;
      justify-content: center;
      min-height: 3rem;
      padding: 0.75rem 1.1rem;
      transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
      width: 100%;
    }

    .primary-action {
      background: var(--accent);
      border: 1px solid var(--accent);
      color: var(--accent-foreground);
      margin-top: 1.6rem;
    }

    .primary-action:hover:not(:disabled),
    .secondary-action:hover {
      transform: translateY(-1px);
    }

    .primary-action:disabled {
      cursor: progress;
      opacity: 0.74;
    }

    .primary-action svg {
      height: 1.2rem;
      width: 1.2rem;
    }

    .secondary-action {
      background: transparent;
      border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
      color: var(--foreground);
      margin-top: 0.75rem;
    }

    .secondary-action:hover {
      border-color: color-mix(in srgb, var(--accent) 60%, transparent);
      color: var(--accent);
    }

    .primary-action:focus-visible,
    .secondary-action:focus-visible {
      outline: 3px solid var(--ring);
      outline-offset: 3px;
    }
  `],
})
export class AuthWallComponent {
  readonly authService = inject(AuthService);

  connectToStrava(): void {
    void this.authService.loginWithStrava();
  }

  previewDashboard(): void {
    this.authService.enterPreviewDashboard();
  }
}
