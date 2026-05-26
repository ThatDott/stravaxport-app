import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import type { DateRange } from '../calendar/calendar.component';
import type { MotivationalQuote } from '../motivational-quote/motivational-quote.model';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { ImageExportPayload, ImageExportStatKey, ImageExportStats, ImageExportStyleOptions } from './image-export.model';

interface SummaryResponse {
  total_activities: number;
  total_distance_km: number;
  formatted_moving_time: string;
  avg_pace_formatted: string;
  avg_speed_kmh: number;
  total_elevation_m: number;
  avg_cadence?: number;
}

interface InsightApiResponse {
  insights: string[];
  geo_comparison: string;
  generated_at: string;
  from_cache: boolean;
}

interface RealExportMetrics {
  distanceKm: number;
  movingTimeFormatted: string;
  avgPaceFormatted: string;
  avgSpeedKph: number;
  totalElevationM: number;
  avgCadence?: number;
  activityCount: number;
}

interface StatOption {
  key: ImageExportStatKey;
  label: string;
}

interface DrawExportOptions {
  payload: ImageExportPayload;
  displayName: string;
  includeUserName: boolean;
  rangeLabel: string;
  quoteText: string;
  stravaLogo: HTMLImageElement | null;
  metrics: Array<{ label: string; value: string }>;
  geoNote: string;
  centerGeoNote: boolean;
}

const STAT_OPTIONS: readonly StatOption[] = [
  { key: 'userName', label: 'User Name' },
  { key: 'distance', label: 'Distance' },
  { key: 'movingTime', label: 'Moving Time' },
  { key: 'averagePace', label: 'Average Pace' },
  { key: 'speed', label: 'Speed' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'elevationGain', label: 'Elevation Gain' },
  { key: 'dateRange', label: 'Date Range' },
  { key: 'activityType', label: 'Activity Type' },
  { key: 'motivationalQuote', label: 'Motivational Quote' },
  { key: 'geographicalData', label: 'Geographical Data' },
  { key: 'stravaLogo', label: 'Strava Logo' },
];

const DEFAULT_STATS: ImageExportStats = {
  userName: true,
  distance: true,
  movingTime: true,
  averagePace: true,
  speed: true,
  cadence: false,
  elevationGain: true,
  dateRange: true,
  activityType: true,
  motivationalQuote: true,
  geographicalData: true,
  stravaLogo: true,
};

const DEFAULT_STYLE_OPTIONS: ImageExportStyleOptions = {
  plainStats: false,
  compactStats: false,
};

const GUILT_TRIPPING_NOTE =
  "Not enough activities yet. Log some miles and check back for your personalised insights!";

@Component({
  selector: 'app-image-export',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-export.component.html',
  styleUrl: './image-export.component.css',
})
export class ImageExportComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly summaryApi = 'http://localhost:8000/api/activities/summary';
  private readonly insightsApi = 'http://localhost:8000/api/insights';

  readonly username = input.required<string>();
  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly quote = input<MotivationalQuote | null>(null);

  readonly statOptions = STAT_OPTIONS;
  readonly stats = signal<ImageExportStats>({ ...DEFAULT_STATS });
  readonly styleOptions = signal<ImageExportStyleOptions>({ ...DEFAULT_STYLE_OPTIONS });
  readonly isExporting = signal(false);
  readonly realMetrics = signal<RealExportMetrics>(emptyRealMetrics());
  readonly geoNote = signal('');

  readonly activityTypes = computed(() => getActivityTypes(this.activity()));
  readonly activityLabel = computed(() => this.activityTypes().join(' | '));
  readonly dateRangeLabel = computed(() => formatDateRange(this.range()));
  readonly exportPayload = computed<ImageExportPayload>(() => ({
    username: this.stats().userName ? this.username() : '',
    activityType: this.activity(),
    activityTypes: this.activityTypes(),
    dateRange: {
      start: formatApiDate(this.range().start),
      end: formatApiDate(this.range().end),
    },
    stats: this.stats(),
    style: this.styleOptions(),
    format: 'png',
  }));

  readonly previewMetrics = computed(() => buildVisibleMetrics(this.stats(), this.realMetrics()));

  readonly hasData = computed(() => this.realMetrics().activityCount > 0);

  readonly displayGeoNote = computed(() =>
    this.hasData() ? this.geoNote() : GUILT_TRIPPING_NOTE,
  );

  constructor() {
    effect(() => {
      const range = this.range();
      const activity = this.activity();
      queueMicrotask(() => {
        void this.loadRealMetrics(range, activity);
      });
    });
  }

  isEnabled(key: ImageExportStatKey): boolean {
    return this.stats()[key];
  }

  toggleStat(key: ImageExportStatKey): void {
    this.stats.update((stats) => ({ ...stats, [key]: !stats[key] }));
  }

  resetStats(): void {
    this.stats.set({ ...DEFAULT_STATS });
    this.styleOptions.set({ ...DEFAULT_STYLE_OPTIONS });
  }

  isStyleEnabled(key: keyof ImageExportStyleOptions): boolean {
    return this.styleOptions()[key];
  }

  toggleStyle(key: keyof ImageExportStyleOptions): void {
    this.styleOptions.update((options) => ({ ...options, [key]: !options[key] }));
  }

  async exportPng(): Promise<void> {
    if (this.isExporting()) {
      return;
    }

    this.isExporting.set(true);

    try {
      await this.ensureWebFontsReady();
      const stravaLogo = this.stats().stravaLogo ? await loadImage('/strava-logo.png') : null;
      const metrics = buildVisibleMetrics(this.stats(), this.realMetrics());
      const note = this.displayGeoNote();
      const blob = await renderTransparentExport({
        payload: this.exportPayload(),
        displayName: this.username(),
        includeUserName: this.stats().userName,
        rangeLabel: this.dateRangeLabel(),
        quoteText: this.quote()?.text ?? '',
        stravaLogo,
        metrics,
        geoNote: note,
        centerGeoNote: !this.hasData(),
      });
      downloadBlob(blob, `${this.username()}-stravaxport.png`);
    } finally {
      this.isExporting.set(false);
    }
  }

  private async loadRealMetrics(range: DateRange, activity: ProgressActivityType): Promise<void> {
    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    try {
      const after = formatApiDate(range.start);
      const before = formatApiDate(addDays(range.end, 1));
      const params = new HttpParams().set('after', after).set('before', before).set('activity_type', activity);

      const summary = await firstValueFrom(
        this.http.get<SummaryResponse>(this.summaryApi, { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }), params }),
      );

      this.realMetrics.set({
        distanceKm: summary.total_distance_km,
        movingTimeFormatted: summary.formatted_moving_time,
        avgPaceFormatted: summary.avg_pace_formatted,
        avgSpeedKph: summary.avg_speed_kmh,
        totalElevationM: summary.total_elevation_m,
        avgCadence: summary.avg_cadence,
        activityCount: summary.total_activities,
      });

      if (summary.total_activities > 0) {
        const stravaId = this.authService.getStravaId();
        if (stravaId) {
          try {
            const response = await firstValueFrom(
              this.http.get<InsightApiResponse>(this.insightsApi, {
                headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
                params: new HttpParams().set('strava_id', stravaId),
              }),
            );
            this.geoNote.set(response.geo_comparison);
          } catch {
            this.geoNote.set('');
          }
        }
      } else {
        this.geoNote.set('');
      }
    } catch {
      this.realMetrics.set(emptyRealMetrics());
      this.geoNote.set('');
    }
  }

  private async ensureWebFontsReady(): Promise<void> {
    try {
      await document.fonts.load('1rem "Maison Neue"');
      await document.fonts.load('600 1rem "Maison Neue"');
      await document.fonts.load('1rem "Nib"');
    } catch {
      // continue anyway – the fallback fonts will be used
    }
  }
}

function emptyRealMetrics(): RealExportMetrics {
  return {
    distanceKm: 0,
    movingTimeFormatted: '0h 0m',
    avgPaceFormatted: '-',
    avgSpeedKph: 0,
    totalElevationM: 0,
    activityCount: 0,
  };
}

function buildVisibleMetrics(stats: ImageExportStats, real: RealExportMetrics): Array<{ label: string; value: string }> {
  const metrics: Array<{ label: string; value: string }> = [];

  if (stats.distance) {
    metrics.push({ label: 'Distance', value: `${real.distanceKm.toFixed(1)} km` });
  }
  if (stats.movingTime) {
    metrics.push({ label: 'Moving Time', value: real.movingTimeFormatted });
  }
  if (stats.averagePace) {
    metrics.push({ label: 'Avg Pace', value: real.avgPaceFormatted });
  }
  if (stats.speed) {
    metrics.push({ label: 'Speed', value: `${real.avgSpeedKph.toFixed(1)} km/h` });
  }
  if (stats.cadence && real.avgCadence != null) {
    metrics.push({ label: 'Cadence', value: `${(real.avgCadence).toFixed(0)} spm` });
  }
  if (stats.elevationGain) {
    metrics.push({ label: 'Elevation', value: `${Math.round(real.totalElevationM)} m` });
  }
  return metrics;
}

function getActivityTypes(activity: ProgressActivityType): readonly string[] {
  if (activity === 'all') {
    return ['walking', 'biking', 'running'];
  }

  if (activity === 'ride') {
    return ['biking'];
  }

  if (activity === 'run') {
    return ['running'];
  }

  return ['walking'];
}

function formatApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateRange(range: DateRange): string {
  if (range.start.toDateString() === range.end.toDateString()) {
    return formatShortDate(range.start);
  }

  return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderTransparentExport(options: DrawExportOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const width = 1080;
  const height = 1080;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) {
    return Promise.reject(new Error('Canvas is not available.'));
  }

  context.scale(scale, scale);

  context.clearRect(0, 0, width, height);

  drawExportCard(context, width, height, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Unable to render export image.'))),
      'image/png',
    );
  });
}

function drawExportCard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: DrawExportOptions
): void {
  const { payload, displayName, includeUserName, rangeLabel, quoteText, stravaLogo, metrics, geoNote, centerGeoNote } = options;
  const stats = payload.stats;
  const style = payload.style;
  const accent = getExportAccent(payload.activityType);

  const darkBg = '#1a1f2e';

  let y = 118;
  context.fillStyle = accent.color;
  context.font = '700 22px "Maison Neue"';
  context.letterSpacing = '8px';
  context.fillText('STRAVAXPORT', 116, y);
  context.letterSpacing = '0px';

  if (stravaLogo) {
    context.drawImage(stravaLogo, width - 214, 94, 98, 31);
  }

  if (includeUserName) {
    y += 62;
    context.fillStyle = '#f8fafc';
    context.font = '700 48px "Nib"';
    context.fillText(displayName, 116, y);
  }

  if (stats.dateRange) {
    y += 42;
    context.fillStyle = '#aab3c4';
    context.font = '400 24px "Maison Neue"';
    context.fillText(rangeLabel, 116, y);
  }

if (stats.activityType) {
    y += 50;
    context.font = '700 20px "Maison Neue"';
    drawPill(context, 116, y - 28, Math.max(168, payload.activityTypes.join(' | ').length * 13), 38, darkBg, payload.activityTypes.join(' | '), accent.color);
  }

  y += 76;
  const cardWidth = style.compactStats ? 390 : 280;
  const cardHeight = style.compactStats ? 78 : 126;
  const gap = style.compactStats ? 18 : 24;
  const columns = style.compactStats ? 2 : 3;

  metrics.forEach((metric, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 116 + column * (cardWidth + gap);
    const top = y + row * (cardHeight + gap);

    if (!style.plainStats) {
      drawRoundRect(context, x, top, cardWidth, cardHeight, 22, darkBg, `rgba(${accent.rgb}, 0.34)`);
    }

    context.fillStyle = '#aab3c4';
    context.font = `700 ${style.compactStats ? 16 : 20}px "Maison Neue"`;
    context.fillText(metric.label.toUpperCase(), x + (style.plainStats ? 0 : 28), top + (style.compactStats ? 24 : 42));
    context.fillStyle = '#f8fafc';
    context.font = `700 ${style.compactStats ? 25 : 34}px "Nib"`;
    context.fillText(metric.value, x + (style.plainStats ? 0 : 28), top + (style.compactStats ? 58 : 86));
  });

  y += Math.ceil(metrics.length / columns) * (cardHeight + gap) + 18;

  // --- Geographical note -------------------------------------------------
  if (stats.geographicalData && geoNote) {
    const geoResult = drawGeoNote(context, accent, geoNote, 116, y, width - 232, centerGeoNote, darkBg);
    y = geoResult.newY;
  }

  // --- Motivational quote ---
  if (stats.motivationalQuote && quoteText) {
    context.strokeStyle = 'rgba(255,255,255,0.15)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(116, y + 20);
    context.lineTo(width - 116, y + 20);
    context.stroke();

    y += 80;

    const quoteResult = drawWrappedQuote(context, quoteText, 116, y, width - 232);
    y = quoteResult.newY;
  }
}

function drawGeoNote(
  context: CanvasRenderingContext2D,
  accent: { color: string; rgb: string },
  text: string,
  startX: number,
  startY: number,
  maxWidth: number,
  centerText = false,
  darkBg: string = '#1a1f2e',
): { newY: number } {
  const paddingX = 25;
  const paddingY = 16;
  const lineHeight = 34;
  const fontSize = 20;
  context.font = `600 ${fontSize}px "Maison Neue"`;

  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = context.measureText(testLine).width;
    if (testWidth > maxWidth - paddingX * 2 && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    lines.push(line);
  }

  const boxHeight = paddingY * 2 + lines.length * lineHeight;
  drawRoundRect(context, startX, startY, maxWidth, boxHeight, 18, darkBg, `rgba(${accent.rgb}, 0.46)`);

  context.fillStyle = '#f8fafc';

  for (let i = 0; i < lines.length; i++) {
    if (centerText) {
      context.textAlign = 'center';
      context.fillText(lines[i], startX + maxWidth / 2, startY + paddingY + (i + 1) * lineHeight);
    } else {
      context.fillText(lines[i], startX + paddingX, startY + paddingY + (i + 1) * lineHeight);
    }
  }

  // Reset alignment
  if (centerText) {
    context.textAlign = 'left';
  }

  return { newY: startY + boxHeight + 20 };
}

function drawWrappedQuote(
  context: CanvasRenderingContext2D,
  text: string,
  startX: number,
  startY: number,
  maxWidth: number,
): { newY: number } {
  const lineHeight = 40;
  const fontSize = 28;
  context.font = `italic 28px "Nib"`;
  context.fillStyle = '#f8fafc';

  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = context.measureText(testLine).width;
    if (testWidth > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    lines.push(line);
  }

  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i], startX, startY + i * lineHeight);
  }

  return { newY: startY + lines.length * lineHeight + 10 };
}

function getExportAccent(activity: ProgressActivityType): { color: string; rgb: string } {
  if (activity === 'ride') {
    return { color: '#9B6A99', rgb: '155, 106, 153' };
  }

  if (activity === 'run') {
    return { color: '#1F6F5F', rgb: '31, 111, 95' };
  }

  return { color: '#19c8f2', rgb: '25, 200, 242' };
}

function drawPill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  background: string,
  text: string,
  color: string,
): void {
  drawRoundRect(context, x, y, width, height, height / 2, background);
  context.fillStyle = color;
  context.fillText(text, x + 22, y + height / 2 + 7);
}

// Helper to load images
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.stroke();
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
