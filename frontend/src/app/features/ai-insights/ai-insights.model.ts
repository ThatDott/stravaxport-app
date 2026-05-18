import type { ProgressActivityType } from '../progress-graph/progress-graph.model';

export interface AiInsightMetric {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
}

export interface AiInsight {
  activity_type?: ProgressActivityType;
  insight_type: string;
  title: string;
  description: string;
  metrics: readonly AiInsightMetric[];
  recommendations: readonly string[];
}

export interface AiInsightResponse {
  insights: readonly AiInsight[];
  generated_at: string;
  period_compared: string;
}
