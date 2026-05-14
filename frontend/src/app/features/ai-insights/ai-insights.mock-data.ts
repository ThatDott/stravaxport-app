import type { AiInsightResponse } from './ai-insights.model';

export const MOCK_AI_INSIGHTS_RESPONSE: AiInsightResponse = {
  generated_at: '2026-05-14T06:00:00.000Z',
  period_compared: 'previous comparable period',
  insights: [
    {
      insight_type: 'performance',
      title: 'You improved your average pace by 12% compared to the previous period.',
      description: '',
      metrics: [
        {
          metric_name: 'Average pace',
          current_value: 5.76,
          previous_value: 6.45,
          change_percentage: 12,
        },
      ],
      recommendations: ['Keep your next session light and steady to hold this pace improvement.'],
    },
  ],
};
