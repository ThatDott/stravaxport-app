import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { DateRange } from '../calendar/calendar.component';
import type { MotivationalQuote } from '../motivational-quote/motivational-quote.model';
import type { ProgressActivityType } from '../progress-graph/progress-graph.model';
import type { ImageExportPayload, ImageExportStatKey, ImageExportStats, ImageExportStyleOptions } from './iamge-export.model';

interface StatOption {
  key: ImageExportStatKey;
  label: string;
}

const STAT_OPTIONS: readonly StatOption[] = [
  { key: 'userName', label: 'User Name' },
  { key: 'distance', label: 'Distance' },
  { key: 'movingTime', label: 'Moving Time' },
  { key: 'averagePace', label: 'Average Pace' },
  { key: 'speed', label: 'Speed' },
  { key: 'heartRate', label: 'Heart Rate' },
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
  heartRate: true,
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

@Component({
  selector: 'app-iamge-export',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './iamge-export.component.html',
  styleUrl: './iamge-export.component.css',
})
export class IamgeExportComponent {
  readonly username = input.required<string>();
  readonly range = input.required<DateRange>();
  readonly activity = input.required<ProgressActivityType>();
  readonly quote = input<MotivationalQuote | null>(null);

  readonly statOptions = STAT_OPTIONS;
  readonly stats = signal<ImageExportStats>({ ...DEFAULT_STATS });
  readonly styleOptions = signal<ImageExportStyleOptions>({ ...DEFAULT_STYLE_OPTIONS });
  readonly isExporting = signal(false);

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
      const stravaLogo = this.stats().stravaLogo ? await loadImage('/strava-logo.png') : null;
      const blob = await renderTransparentExport({
        payload: this.exportPayload(),
        displayName: this.username(),
        includeUserName: this.stats().userName,
        rangeLabel: this.dateRangeLabel(),
        quoteText: this.quote()?.text ?? '',
        stravaLogo,
      });
      downloadBlob(blob, `${this.username()}-stravaxport.png`);
    } finally {
      this.isExporting.set(false);
    }
  }
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

function formatDateRange(range: DateRange): string {
  if (range.start.toDateString() === range.end.toDateString()) {
    return formatShortDate(range.start);
  }

  return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderTransparentExport(options: {
  payload: ImageExportPayload;
  displayName: string;
  includeUserName: boolean;
  rangeLabel: string;
  quoteText: string;
  stravaLogo: HTMLImageElement | null;
}): Promise<Blob> {
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
  drawExportCard(context, width, height, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Unable to render export image.'))), 'image/png');
  });
}

function drawExportCard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    payload: ImageExportPayload;
    displayName: string;
    includeUserName: boolean;
    rangeLabel: string;
    quoteText: string;
    stravaLogo: HTMLImageElement | null;
  },
): void {
  const { payload, displayName, includeUserName, rangeLabel, quoteText, stravaLogo } = options;
  const stats = payload.stats;
  const style = payload.style;
  const accent = getExportAccent(payload.activityType);
  let y = 118;

  context.fillStyle = accent.color;
  context.font = '700 22px Arial';
  context.letterSpacing = '8px';
  context.fillText('STRAVAXPORT', 116, y);
  context.letterSpacing = '0px';

  if (stravaLogo) {
    context.drawImage(stravaLogo, width - 214, 94, 98, 31);
  }

  if (includeUserName) {
    y += 62;
    context.fillStyle = '#f8fafc';
    context.font = '700 48px Georgia';
    context.fillText(displayName, 116, y);
  }

  if (stats.dateRange) {
    y += 42;
    context.fillStyle = '#aab3c4';
    context.font = '400 24px Arial';
    context.fillText(rangeLabel, 116, y);
  }

  if (stats.activityType) {
    y += 50;
    drawPill(context, 116, y - 28, Math.max(168, payload.activityTypes.join(' | ').length * 13), 38, `rgba(${accent.rgb}, 0.16)`, payload.activityTypes.join(' | '), accent.color);
  }

  y += 76;
  const metrics = buildExportMetrics(stats);
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
      drawRoundRect(context, x, top, cardWidth, cardHeight, 22, 'rgba(255, 255, 255, 0.08)', `rgba(${accent.rgb}, 0.34)`);
    }

    context.fillStyle = '#aab3c4';
    context.font = `700 ${style.compactStats ? 16 : 20}px Arial`;
    context.fillText(metric.label.toUpperCase(), x + (style.plainStats ? 0 : 28), top + (style.compactStats ? 24 : 42));
    context.fillStyle = '#f8fafc';
    context.font = `700 ${style.compactStats ? 25 : 34}px Georgia`;
    context.fillText(metric.value, x + (style.plainStats ? 0 : 28), top + (style.compactStats ? 58 : 86));
  });

  y += Math.ceil(metrics.length / columns) * (cardHeight + gap) + 10;

  if (stats.geographicalData) {
    drawRoundRect(context, 116, y, width - 232, 70, 18, `rgba(${accent.rgb}, 0.12)`, `rgba(${accent.rgb}, 0.46)`);
    context.fillStyle = '#f8fafc';
    context.font = '600 23px Arial';
    context.fillText("That's 7.2% the length of the Philippines and 43% of Mt. Apo's height.", 142, y + 43);
    y += 108;
  }

  if (stats.motivationalQuote && quoteText) {
    context.fillStyle = '#f8fafc';
    context.font = 'italic 28px Georgia';
    context.fillText(quoteText, 116, y);
  }
}

function buildExportMetrics(stats: ImageExportStats): Array<{ label: string; value: string }> {
  return [
    stats.distance ? { label: 'Distance', value: '133.6 km' } : null,
    stats.movingTime ? { label: 'Moving Time', value: '8h 57m' } : null,
    stats.averagePace ? { label: 'Avg Pace', value: '5:46/km' } : null,
    stats.speed ? { label: 'Speed', value: '19.2 km/h' } : null,
    stats.heartRate ? { label: 'Heart Rate', value: '150 bpm' } : null,
    stats.cadence ? { label: 'Cadence', value: '164 spm' } : null,
    stats.elevationGain ? { label: 'Elevation', value: '1256 m' } : null,
  ].filter((metric) => metric !== null);
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
  context.font = '700 20px Arial';
  context.fillText(text, x + 22, y + height / 2 + 7);
}

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
