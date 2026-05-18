import type { AiInsightResponse } from './ai-insights.model';

export const MOCK_AI_INSIGHTS_RESPONSE: AiInsightResponse = {
  generated_at: '2026-05-14T06:00:00.000Z',
  period_compared: 'previous comparable period',
  insights: [
    {
      activity_type: 'all',
      insight_type: 'performance',
      title: 'Your mixed activity load is trending up with balanced gains across distance and consistency.',
      description: '',
      metrics: [
        {
          metric_name: 'Weekly distance',
          current_value: 84.2,
          previous_value: 73.6,
          change_percentage: 14,
        },
      ],
      recommendations: ['Keep one lighter recovery day between higher-effort sessions to protect the trend.'],
    },
    {
      activity_type: 'walk',
      insight_type: 'walking',
      title: 'Your walking consistency improved, with more low-intensity movement across the week.',
      description: '',
      metrics: [
        {
          metric_name: 'Walking days',
          current_value: 8,
          previous_value: 6,
          change_percentage: 33,
        },
      ],
      recommendations: ['Add one relaxed 20-minute walk after a harder training day to keep recovery active.'],
    },
    {
      activity_type: 'ride',
      insight_type: 'cycling',
      title: 'Your bike distance is climbing while average speed remains steady.',
      description: '',
      metrics: [
        {
          metric_name: 'Ride distance',
          current_value: 126.4,
          previous_value: 108.2,
          change_percentage: 17,
        },
      ],
      recommendations: ['Hold cadence steady on longer rides before adding more intensity.'],
    },
    {
      activity_type: 'run',
      insight_type: 'running',
      title: 'Your running pace is improving without a big jump in total load.',
      description: '',
      metrics: [
        {
          metric_name: 'Average run pace',
          current_value: 5.47,
          previous_value: 5.92,
          change_percentage: 8,
        },
      ],
      recommendations: ['Keep the next run conversational, then place your quicker effort after a rest or walk day.'],
    },
  ],
};
