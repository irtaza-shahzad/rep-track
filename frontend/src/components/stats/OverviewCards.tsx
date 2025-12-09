/**
 * Stats Overview Cards Component
 * Displays key statistics at a glance
 */

import { Calendar, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OverviewCardsProps {
  totalWorkouts: number;
  avgSetsPerWorkout: number;
  consistency: number;
}

const OverviewCards = ({ totalWorkouts, avgSetsPerWorkout, consistency }: OverviewCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Sets/Workout</p>
              <p className="text-2xl font-bold">{avgSetsPerWorkout}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-chart-gold/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-chart-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consistency</p>
              <p className="text-2xl font-bold">{consistency}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewCards;
