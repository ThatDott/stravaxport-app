import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { AiInsightsComponent } from '../ai-insights/ai-insights.component';
import { MOCK_AI_INSIGHTS_RESPONSE } from '../ai-insights/ai-insights.mock-data';
import { CalendarComponent, DateRange } from '../calendar/calendar.component';
import { MotivationalQuoteComponent } from '../motivational-quote/motivational-quote.component';
import { MOCK_DAILY_QUOTES_RESPONSE } from '../motivational-quote/motivational-quote.mock-data';
import { MotivationalQuoteService } from '../motivational-quote/motivational-quote.service';
import { OverviewComponent } from '../overview/overview.component';
import { MOCK_DASHBOARD_USER, createMockInitialDateRange } from './dashboard.mock-data';
import { firstValueFrom } from 'rxjs';

type DashboardSection = 'dashboard' | 'calendar' | 'ai-insights' | 'overview';

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
];

@Component({
  selector: 'app-dashboard',
  imports: [AiInsightsComponent, CalendarComponent, MotivationalQuoteComponent, NgOptimizedImage, OverviewComponent],
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

  logout(): void {
    this.authService.logout();
  }

  private async loadDailyQuotes(): Promise<void> {
    const response = await firstValueFrom(this.motivationalQuoteService.getDailyQuotes());
    this.dailyQuotes.set(response);
  }
}

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

  return 'dashboard';
}
