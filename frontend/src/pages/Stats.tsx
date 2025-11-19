import { useState } from 'react';
import { TrendingUp, Calendar, Target, Flame, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import { getStreakConfig, initializeStreak, getCurrentWeekProgress } from '@/lib/streakStorage';

const Stats = () => {
  const [streakConfig, setStreakConfig] = useState(getStreakConfig());
  const [showStreakSetup, setShowStreakSetup] = useState(false);
  const [targetDays, setTargetDays] = useState(4);
  
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

  const handleStartStreaks = () => {
    setShowStreakSetup(true);
  };

  const handleSetupStreak = () => {
    const config = initializeStreak(targetDays);
    setStreakConfig(config);
    setShowStreakSetup(false);
  };

  const currentWeekProgress = getCurrentWeekProgress();

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Stats</h1>
          <p className="text-muted-foreground">Track your progress and streaks</p>
        </div>

        <Tabs defaultValue="statistics" className="animate-slide-up">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <Card className="mb-6 card-elevated">
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
            <Card className="card-elevated mb-6">
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

            {/* AI Insights Placeholder */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">AI Insights (Coming Soon)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">AI-powered insights about your progress trends</p>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-accent" />
                      Strength Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Track strength improvements across exercises</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks">
            {!streakConfig ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="card-elevated max-w-md w-full">
                  <CardContent className="pt-6 text-center">
                    <Flame className="h-16 w-16 mx-auto mb-4 text-accent" />
                    <h3 className="text-xl font-bold mb-2">Start Your Streak</h3>
                    <p className="text-muted-foreground mb-6">
                      Set a weekly workout goal and track your consistency
                    </p>
                    <Button onClick={handleStartStreaks} size="lg">
                      Start Streaks
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Streak */}
                <Card className="card-elevated">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Flame className="h-20 w-20 mx-auto mb-4 text-accent" />
                      <h2 className="text-4xl font-bold mb-2">{streakConfig.currentStreak}</h2>
                      <p className="text-muted-foreground">Day Streak</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Progress */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {currentWeekProgress} / {streakConfig.targetDaysPerWeek} days
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (currentWeekProgress / streakConfig.targetDaysPerWeek) * 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="card-elevated">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Weekly Goal</p>
                          <p className="text-2xl font-bold">{streakConfig.targetDaysPerWeek} days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-elevated">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-chart-gold/10 flex items-center justify-center">
                          <Award className="h-6 w-6 text-chart-gold" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Longest Streak</p>
                          <p className="text-2xl font-bold">{streakConfig.longestStreak} days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Streak Setup Dialog */}
        <Dialog open={showStreakSetup} onOpenChange={setShowStreakSetup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Your Goal</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                How many days per week is your goal?
              </label>
              <Input
                type="number"
                min={1}
                max={7}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="text-center text-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStreakSetup(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetupStreak}>
                Start Tracking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Stats;
