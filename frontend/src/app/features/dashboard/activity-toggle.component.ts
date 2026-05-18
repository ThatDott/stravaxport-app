import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ProgressActivityOption, ProgressActivityType } from '../progress-graph/progress-graph.model';

const ACTIVITY_OPTIONS: readonly ProgressActivityOption[] = [
  { value: 'all', label: 'All activities' },
  { value: 'walk', label: 'Walking' },
  { value: 'ride', label: 'Biking' },
  { value: 'run', label: 'Running' },
];

@Component({
  selector: 'app-activity-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3" aria-label="Activity filter">
      <span class="text-[0.82rem] uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Activity</span>
      <div
        class="flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] p-1"
      >
        @for (option of activityOptions; track option.value) {
          <button
            class="relative z-1 flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--muted-foreground)] transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--ring)]"
            type="button"
            [style.background]="selectedActivity() === option.value ? activeBackground(option.value) : null"
            [style.color]="selectedActivity() === option.value ? activeColor(option.value) : null"
            [attr.aria-pressed]="selectedActivity() === option.value"
            [attr.aria-label]="option.label"
            (click)="selectActivity(option.value)"
          >
            @switch (option.value) {
              @case ('all') {
                <svg class="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <rect x="4" y="4" width="6" height="6" rx="1.4" />
                  <rect x="14" y="4" width="6" height="6" rx="1.4" />
                  <rect x="4" y="14" width="6" height="6" rx="1.4" />
                  <rect x="14" y="14" width="6" height="6" rx="1.4" />
                </svg>
              }
              @case ('walk') {
                <svg class="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8.4 6.4c.8-1.8 2.8-2.8 4.2-2.2 1.4.6 1.7 2.4.8 4.2-.8 1.8-2.6 3.1-4 2.5-1.4-.6-1.9-2.7-1-4.5Z" />
                  <path d="M14.3 14.7c1.3-1.4 3.5-1.8 4.6-.8s.8 2.8-.5 4.3c-1.3 1.4-3.4 2.1-4.5 1.1-1.2-1-.9-3.1.4-4.6Z" />
                  <path d="M6.3 15.2c.8-.9 2.2-1.1 3-.4.8.7.7 2-.1 2.9-.8.9-2.2 1.2-3 .5-.8-.7-.7-2.1.1-3Z" />
                  <path d="M15.9 5.2c.7-.8 2-.9 2.7-.3.7.6.7 1.8 0 2.6-.7.8-1.9 1-2.7.4-.7-.6-.7-1.9 0-2.7Z" />
                </svg>
              }
              @case ('ride') {
                <svg class="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="6.5" cy="16.5" r="3.5" />
                  <circle cx="17.5" cy="16.5" r="3.5" />
                  <path d="M9.5 16.5 12 9h3l-3 7.5h5.5" />
                  <path d="M12 9 8.5 16.5" />
                  <path d="M14 6h3" />
                </svg>
              }
              @case ('run') {
                <svg class="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <circle cx="13" cy="4.5" r="1.8" />
                  <path d="m10.8 8.2 3.4 1.8 2.1 3.7" />
                  <path d="m11.4 10.3-2.2 3.4 3.4 2.1" />
                  <path d="m12.6 15.8-2.5 4.2" />
                  <path d="m16.4 13.8 2.1 2.8" />
                  <path d="M7.2 9.4 10.8 8" />
                </svg>
              }
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class ActivityToggleComponent {
  readonly selectedActivity = input.required<ProgressActivityType>();
  readonly activityChange = output<ProgressActivityType>();
  readonly activityOptions = ACTIVITY_OPTIONS;

  selectActivity(activity: ProgressActivityType): void {
    this.activityChange.emit(activity);
  }

  activeBackground(activity: ProgressActivityType): string {
    if (activity === 'ride') {
      return '#9B6A99';
    }

    if (activity === 'run') {
      return '#1F6F5F';
    }

    return 'var(--accent)';
  }

  activeColor(activity: ProgressActivityType): string {
    if (activity === 'ride') {
      return '#1f1028';
    }

    if (activity === 'run') {
      return '#ecfdf5';
    }

    return 'var(--accent-foreground)';
  }
}
