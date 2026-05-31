export interface AiInsightResponse {
  insights: readonly string[];
  geo_comparison: string;
  generated_at: string;
  from_cache: boolean;
}
