/**
 * Workout Frequency Chart Component
 * Bar chart showing number of workouts per period
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_STYLES, CHART_MARGINS, formatDateForChart } from './chartStyles';

interface FrequencyDataPoint {
  date: string;
  workouts: number;
}

interface WorkoutFrequencyChartProps {
  data: FrequencyDataPoint[];
  period: 'day' | 'week' | 'month';
}

const WorkoutFrequencyChart = ({ data, period }: WorkoutFrequencyChartProps) => {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Workout Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={CHART_MARGINS}>
            <CartesianGrid {...CHART_STYLES.grid} />
            <XAxis 
              dataKey="date" 
              stroke={CHART_STYLES.axis.stroke}
              tick={CHART_STYLES.axis.tick}
              tickFormatter={(value) => formatDateForChart(value, period)}
            />
            <YAxis 
              stroke={CHART_STYLES.axis.stroke}
              tick={CHART_STYLES.axis.tick}
              width={40}
            />
            <Tooltip 
              contentStyle={CHART_STYLES.tooltip.contentStyle}
              labelStyle={CHART_STYLES.tooltip.labelStyle}
              formatter={(value: any) => [value, 'Workouts']}
            />
            <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
            <Bar 
              dataKey="workouts" 
              fill={CHART_STYLES.colors.accent}
              radius={[4, 4, 0, 0]}
              name="Workouts"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WorkoutFrequencyChart;
