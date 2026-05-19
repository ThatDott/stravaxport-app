import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ActivitiesComponent } from '../activities/activities.component';
import { AiInsightsComponent } from '../ai-insights/ai-insights.component';
import { MOCK_AI_INSIGHTS_RESPONSE } from '../ai-insights/ai-insights.mock-data';
import { AverageStatsComponent } from '../average-stats/average-stats.component';
import { CalendarComponent, DateRange } from '../calendar/calendar.component';
import { ImageExportComponent } from '../image-export/image-export.component';
import { MotivationalQuoteComponent } from '../motivational-quote/motivational-quote.component';
import { MOCK_DAILY_QUOTES_RESPONSE } from '../motivational-quote/motivational-quote.mock-data';
import { MotivationalQuoteService } from '../motivational-quote/motivational-quote.service';
import { OverviewComponent } from '../overview/overview.component';
import { ProgressGraphComponent } from '../progress-graph/progress-graph.component';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import { ActivityToggleComponent } from './activity-toggle.component';
import { MOCK_DASHBOARD_USER, createMockInitialDateRange } from './dashboard.mock-data';
import { firstValueFrom } from 'rxjs';

type DashboardSection =
  | 'dashboard'
  | 'calendar'
  | 'ai-insights'
  | 'overview'
  | 'average-stats'
  | 'progress'
  | 'activities'
  | 'export';

interface SidebarItem {
  section: DashboardSection;
  href: string;
  label: string;
}

const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { section: 'dashboard', href: '#dashboard-home', label: 'Dashboard' },
  { section: 'calendar', href: '#calendar-section', label: 'Calendar' },
  { section: 'ai-insights', href: '#ai-insights-section', label: 'AI Insights' },
  { section: 'overview', href: '#overview-section', label: 'Overview' },
  { section: 'average-stats', href: '#average-stats-section', label: 'Average Stats' },
  { section: 'progress', href: '#progress-section', label: 'Progress' },
  { section: 'activities', href: '#activities-section', label: 'Activities' },
  { section: 'export', href: '#export-section', label: 'Export' },
];

@Component({
  selector: 'app-dashboard',
  imports: [
    AiInsightsComponent,
    ActivitiesComponent,
    CalendarComponent,
    AverageStatsComponent,
    ImageExportComponent,
    ActivityToggleComponent,
    MotivationalQuoteComponent,
    NgOptimizedImage,
    OverviewComponent,
    ProgressGraphComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly motivationalQuoteService = inject(MotivationalQuoteService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sidebarItems = SIDEBAR_ITEMS;
  readonly userProfile = signal(MOCK_DASHBOARD_USER);
  readonly activeSection = signal<DashboardSection>('dashboard');
  readonly selectedRange = signal<DateRange>(createMockInitialDateRange());
  readonly selectedActivity = signal<ProgressActivityType>('all');
  readonly aiInsights = signal(MOCK_AI_INSIGHTS_RESPONSE);
  readonly dailyQuotes = signal(MOCK_DAILY_QUOTES_RESPONSE);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const section = sectionFromHash(window.location.hash);
    this.activeSection.set(section);
    void this.loadDailyQuotes();
  }

  updateDateRange(range: DateRange): void {
    this.selectedRange.set(normalizeRange(range));
  }

  setActiveSection(section: DashboardSection): void {
    this.activeSection.set(section);
  }

  selectActivity(activity: ProgressActivityType): void {
    this.selectedActivity.set(activity);
  }

  themeAccent(): string | null {
    return this.activityThemeValue('accent');
  }

  themeAccentForeground(): string | null {
    return this.activityThemeValue('accentForeground');
  }

  themePrimary(): string | null {
    return this.activityThemeValue('primary');
  }

  themeBackground(): string | null {
    return this.activityThemeValue('background');
  }

  themeCard(): string | null {
    return this.activityThemeValue('card');
  }

  themeRing(): string | null {
    return this.activityThemeValue('ring');
  }

  logout(): void {
    this.authService.logout();
  }

  private async loadDailyQuotes(): Promise<void> {
    const response = await firstValueFrom(this.motivationalQuoteService.getDailyQuotes());
    this.dailyQuotes.set(response);
  }

  private activityThemeValue(key: keyof ActivityTheme): string | null {
    const theme = ACTIVITY_THEMES[this.selectedActivity()];
    return theme?.[key] ?? null;
  }
}

interface ActivityTheme {
  accent: string;
  accentForeground: string;
  primary: string;
  background: string;
  card: string;
  ring: string;
}

const ACTIVITY_THEMES: Partial<Record<ProgressActivityType, ActivityTheme>> = {
  ride: {
    accent: '#9B6A99',
    accentForeground: '#1f1028',
    primary: 'color-mix(in srgb, #9B6A99 82%, #e9d5ff)',
    background: 'color-mix(in srgb, #1b1424 74%, var(--color-black))',
    card: 'color-mix(in srgb, #281b34 78%, var(--color-black))',
    ring: '#c59ac3',
  },
  run: {
    accent: '#1F6F5F',
    accentForeground: '#ecfdf5',
    primary: 'color-mix(in srgb, #1F6F5F 82%, #5eead4)',
    background: 'color-mix(in srgb, #071917 74%, var(--color-black))',
    card: 'color-mix(in srgb, #0d2420 78%, var(--color-black))',
    ring: '#3d9b87',
  },
};

function normalizeRange(range: DateRange): DateRange {
  const start = startOfDay(range.start);
  const end = startOfDay(range.end);

  return start.getTime() <= end.getTime() ? { start, end } : { start: end, end: start };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  return next;
}

function sectionFromHash(hash: string): DashboardSection {
  if (hash === '#calendar-section') {
    return 'calendar';
  }

  if (hash === '#ai-insights-section') {
    return 'ai-insights';
  }

  if (hash === '#overview-section') {
    return 'overview';
  }

  if (hash === '#average-stats-section') {
    return 'average-stats';
  }

  if (hash === '#progress-section') {
    return 'progress';
  }

  if (hash === '#activities-section') {
    return 'activities';
  }

  if (hash === '#export-section') {
    return 'export';
  }

  return 'dashboard';
}
