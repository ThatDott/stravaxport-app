import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ProgressActivityType } from '../../progress-graph/progress-graph.model';

@Component({
  selector: 'app-average-elevation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="stat-card" aria-labelledby="average-elevation-title">
      <header class="stat-header">
        <span class="stat-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="m3 19 6-14 4 9 2-4 6 9H3Z" />
          </svg>
        </span>
        <h3 id="average-elevation-title">Elevation Gain</h3>
        <span class="activity-pill" [attr.aria-label]="'Showing ' + activityLabel() + ' averages'">
          @switch (activity()) {
            @case ('ride') {
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <circle cx="6.5" cy="16.5" r="3.5" />
                <circle cx="17.5" cy="16.5" r="3.5" />
                <path d="M9.5 16.5 12 9h3l-3 7.5h5.5" />
                <path d="M12 9 8.5 16.5" />
                <path d="M14 6h3" />
              </svg>
            }
            @case ('walk') {
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M8.4 6.4c.8-1.8 2.8-2.8 4.2-2.2 1.4.6 1.7 2.4.8 4.2-.8 1.8-2.6 3.1-4 2.5-1.4-.6-1.9-2.7-1-4.5Z" />
                <path d="M14.3 14.7c1.3-1.4 3.5-1.8 4.6-.8s.8 2.8-.5 4.3c-1.3 1.4-3.4 2.1-4.5 1.1-1.2-1-.9-3.1.4-4.6Z" />
                <path d="M6.3 15.2c.8-.9 2.2-1.1 3-.4.8.7.7 2-.1 2.9-.8.9-2.2 1.2-3 .5-.8-.7-.7-2.1.1-3Z" />
              </svg>
            }
            @default {
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            }
          }
        </span>
      </header>
      <p class="stat-value">
        <strong>{{ formattedElevation() }}</strong>
        <span>m total</span>
      </p>
      <p class="stat-note">Equivalent to climbing {{ equivalentPercent() }}% of Mt. Apo</p>
    </article>
  `,
  styleUrl: '../average-stats-card.css',
})
export class AverageElevationComponent {
  readonly activity = input.required<ProgressActivityType>();
  readonly elevationM = input.required<number>();
  readonly equivalentPercent = input.required<number>();

  formattedElevation(): string {
    return new Intl.NumberFormat('en-US').format(this.elevationM());
  }

  activityLabel(): string {
    return labelForActivity(this.activity());
  }
}

function labelForActivity(activity: ProgressActivityType): string {
  if (activity === 'walk') {
    return 'walking';
  }

  if (activity === 'ride') {
    return 'biking';
  }

  return 'all activity';
}
