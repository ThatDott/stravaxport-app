import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { AiInsightsComponent } from '../ai-insights/ai-insights.component';
import { MOCK_AI_INSIGHTS_RESPONSE } from '../ai-insights/ai-insights.mock-data';
import { CalendarComponent, DateRange } from '../calendar/calendar.component';
import { MOCK_DASHBOARD_USER, createMockInitialDateRange } from './dashboard.mock-data';

type DashboardSection = 'dashboard' | 'calendar' | 'ai-insights';

interface SidebarItem {
  section: DashboardSection;
  href: string;
  label: string;
}

const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { section: 'dashboard', href: '#dashboard-home', label: 'Dashboard' },
  { section: 'calendar', href: '#calendar-section', label: 'Calendar' },
  { section: 'ai-insights', href: '#ai-insights-section', label: 'AI Insights' },
];

@Component({
  selector: 'app-dashboard',
  imports: [AiInsightsComponent, CalendarComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sidebarItems = SIDEBAR_ITEMS;
  readonly userProfile = signal(MOCK_DASHBOARD_USER);
  readonly activeSection = signal<DashboardSection>('dashboard');
  readonly selectedRange = signal<DateRange>(createMockInitialDateRange());
  readonly aiInsights = signal(MOCK_AI_INSIGHTS_RESPONSE);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const section = sectionFromHash(window.location.hash);
    this.activeSection.set(section);
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

  return 'dashboard';
}
