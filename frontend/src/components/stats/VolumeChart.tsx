/**
 * Volume Chart Component
 * Line chart showing training volume over time
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_STYLES, CHART_MARGINS, formatDateForChart } from './chartStyles';

interface VolumeDataPoint {
  date: string;
  volume: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  period: 'day' | 'week' | 'month';
  weightUnit: string;
}

const VolumeChart = ({ data, period, weightUnit }: VolumeChartProps) => {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Training Volume Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={CHART_MARGINS}>
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
              width={60}
            />
            <Tooltip 
              contentStyle={CHART_STYLES.tooltip.contentStyle}
              labelStyle={CHART_STYLES.tooltip.labelStyle}
              formatter={(value: any) => [`${value} ${weightUnit}`, 'Volume']}
            />
            <Legend wrapperStyle={CHART_STYLES.legend.wrapperStyle} />
            <Line 
              type="monotone" 
              dataKey="volume" 
              stroke={CHART_STYLES.colors.primary}
              strokeWidth={3}
              dot={{ fill: CHART_STYLES.colors.primary, r: 4 }}
              activeDot={{ r: 6 }}
              name={`Volume (${weightUnit})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VolumeChart;
