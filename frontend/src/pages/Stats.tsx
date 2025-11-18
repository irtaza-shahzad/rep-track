import { TrendingUp, Calendar, Target, BarChart3, Activity, Dumbbell, Flame, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';

const Stats = () => {
  const progressData = [
    { month: 'Jan', volume: 8500 },
    { month: 'Feb', volume: 9200 },
    { month: 'Mar', volume: 10100 },
    { month: 'Apr', volume: 11500 },
    { month: 'May', volume: 12500 },
  ];

  const personalRecords = [
    { exercise: 'Bench Press', weight: '225 lbs', date: 'May 8' },
    { exercise: 'Squat', weight: '315 lbs', date: 'May 5' },
    { exercise: 'Deadlift', weight: '405 lbs', date: 'Apr 28' },
  ];

  const maxVolume = Math.max(...progressData.map(d => d.volume));

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Progress Stats</h1>
          <p className="text-muted-foreground">Track your fitness journey</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Workouts</p>
                  <p className="text-2xl font-bold">47</p>
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
                  <p className="text-sm text-muted-foreground">Avg per Week</p>
                  <p className="text-2xl font-bold">4.2</p>
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
                  <p className="text-2xl font-bold">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume Chart */}
        <Card className="mb-6 card-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>Training Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.map((data) => (
                <div key={data.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{data.month}</span>
                    <span className="font-medium">{data.volume.toLocaleString()} lbs</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 animate-scale-in"
                      style={{ width: `${(data.volume / maxVolume) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card className="card-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>Personal Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                >
                  <div>
                    <h3 className="font-semibold">{record.exercise}</h3>
                    <p className="text-sm text-muted-foreground">{record.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{record.weight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Placeholder Cards */}
        <div className="space-y-6 mt-6">
          {/* Progress Overview */}
          <Card className="card-elevated animate-slide-up hover-scale">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Progress Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered insights coming soon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border-2 border-dashed border-muted/50 bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Chart will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Strength Trends */}
          <Card className="card-elevated animate-slide-up hover-scale">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Strength Trends</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered insights coming soon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border-2 border-dashed border-muted/50 bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Chart will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Muscle Group Balance */}
          <Card className="card-elevated animate-slide-up hover-scale">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-chart-gold/10 flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-chart-gold" />
                </div>
                <div>
                  <CardTitle>Muscle Group Balance</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered insights coming soon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border-2 border-dashed border-muted/50 bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Chart will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Workout Consistency */}
          <Card className="card-elevated animate-slide-up hover-scale">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Workout Consistency</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered insights coming soon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border-2 border-dashed border-muted/50 bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Chart will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Performance */}
          <Card className="card-elevated animate-slide-up hover-scale">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Weekly Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered insights coming soon</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-xl border-2 border-dashed border-muted/50 bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Chart will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
