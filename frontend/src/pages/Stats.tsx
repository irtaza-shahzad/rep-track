import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, Calendar, Target, Flame, Award, Trophy, Medal, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Layout from '@/components/Layout';
import { getMyStreak, startStreak, updateTargetDays, type Streak } from '@/services/streakService';
import PageHeader from '@/components/PageHeader';
import { usePreferences } from '@/contexts/PreferencesContext';
import { statsService, Summary, TimeseriesPoint } from '@/services/statsService';
import { formatLargeNumber, formatWeight } from '@/lib/numberFormat';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const Stats = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [showStreakSetup, setShowStreakSetup] = useState(false);
  const [targetDays, setTargetDays] = useState(3);
  const [dateRange, setDateRange] = useState('90'); // 90 days default
  const [selectedExerciseForPR, setSelectedExerciseForPR] = useState<string>('all');
  const { preferences, convertWeight } = usePreferences();
  
  // Smart period selection based on date range to prevent messy graphs
  const getOptimalPeriod = (days: string): 'day' | 'week' | 'month' => {
    const numDays = parseInt(days);
    if (numDays <= 30) return 'day';      // Last 30 days: daily view
    if (numDays <= 90) return 'week';     // Last 90 days: weekly view
    if (numDays <= 180) return 'week';    // Last 6 months: weekly view
    return 'month';                        // Last year: monthly view
  };
  
  const period = getOptimalPeriod(dateRange);
  
  // Stats data from API
  const [summary, setSummary] = useState<Summary | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch summary
        const summaryData = await statsService.getSummary();
        setSummary(summaryData);
        
        // Calculate date range
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Fetch timeseries
        const timeseries = await statsService.getTimeseries(period, fromDate, toDate);
        setTimeseriesData(timeseries);

        // Fetch streak
        const streakData = await getMyStreak().catch(() => null);
        setStreak(streakData);
      } catch (err) {
        logger.error('Failed to fetch stats', err);
        setError('Failed to load stats data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange, period, location.pathname]);
  
  // Transform timeseries data for charts
  const volumeData = timeseriesData.map(point => ({
    date: point.periodStart,
    volume: Math.round(convertWeight(point.volume, 'lbs'))
  }));
  
  const workoutFrequencyData = timeseriesData.map(point => ({
    date: point.periodStart,
    workouts: point.workoutsCompleted
  }));
  
  const durationData = timeseriesData.map(point => ({
    date: point.periodStart,
    duration: Math.round(point.avgDurationMin)
  }));
  
  const repsData = timeseriesData.map(point => ({
    date: point.periodStart,
    reps: point.repsLogged
  }));
  
  const setsData = timeseriesData.map(point => ({
    date: point.periodStart,
    sets: point.setsLogged
  }));
  
  // Calculate average sets per workout
  const avgSetsData = timeseriesData.map(point => ({
    date: point.periodStart,
    avgSets: point.workoutsCompleted > 0 ? Math.round(point.setsLogged / point.workoutsCompleted) : 0
  }));
  
  // Define the 5 main compound movements we want to track
  const COMPOUND_MOVEMENTS = [
    'Bench Press',
    'Squat', 
    'Deadlift',
    'Overhead Press',
    'Pull-ups'
  ];
  
  // Transform PRs data - only show the 5 main compound movements
  const personalRecords = summary?.bestOneRepMaxByExercise 
    ? Object.entries(summary.bestOneRepMaxByExercise)
        .filter(([exercise, weight]) => {
          // Only include the 5 main compound movements
          return COMPOUND_MOVEMENTS.includes(exercise);
        })
        .map(([exercise, weight]) => ({
          exercise,
          weight: Math.round(convertWeight(weight, 'lbs')),
          date: 'Recent',
          reps: 1
        }))
        .sort((a, b) => b.weight - a.weight)
    : [];
  
  // Get unique exercises from PRs for the filter
  const availableExercises = personalRecords.map(pr => pr.exercise);
  
  // PR progression data - build from timeseries historical data
  // This creates step-wise progression: flat until new PR, then climbs
  const prProgressionData = (() => {
    if (!timeseriesData.length) return [];
    
    // Track cumulative best PRs across all periods
    const cumulativePRs: Record<string, number> = {};
    
    return timeseriesData.map(point => {
      const data: any = { date: point.periodStart };
      
      // Update cumulative PRs with this period's PRs
      if (point.bestOneRepMaxByExercise) {
        Object.entries(point.bestOneRepMaxByExercise).forEach(([exercise, weight]) => {
          // Only track if it's better than what we've seen so far
          if (!cumulativePRs[exercise] || weight > cumulativePRs[exercise]) {
            cumulativePRs[exercise] = weight;
          }
        });
      }
      
      // Add top 4 exercises to the data point
      personalRecords.forEach((pr, index) => {
        if (index < 4) {
          // Use cumulative PR (best so far) or null if no data yet
          data[pr.exercise] = cumulativePRs[pr.exercise] 
            ? Math.round(convertWeight(cumulativePRs[pr.exercise], 'lbs'))
            : null;
        }
      });
      
      return data;
    });
  })();
  
  // Muscle Group Distribution - use real data from backend
  const muscleGroupColors: Record<string, string> = {
    'Chest': '#3B82F6',
    'Back': '#8B5CF6',
    'Legs': '#10B981',
    'Shoulders': '#F59E0B',
    'Arms': '#EF4444',
    'Core': '#EC4899',
    'FullBody': '#06B6D4',
    'Other': '#6B7280',
  };
  
  const muscleGroupData = summary?.muscleGroupBreakdown
    ? Object.entries(summary.muscleGroupBreakdown)
        .map(([name, sets]) => ({
          name,
          sets: sets as number,
          color: muscleGroupColors[name] || '#6B7280'
        }))
        .sort((a, b) => b.sets - a.sets) // Sort by most sets
    : [];
  
  // Calculate filtered total workouts from timeseries data
  const filteredTotalWorkouts = timeseriesData.reduce((sum, p) => sum + p.workoutsCompleted, 0);
  
  // Calculate average sets per workout (within filtered range)
  const filteredTotalSets = timeseriesData.reduce((sum, p) => sum + p.setsLogged, 0);
  const avgSetsPerWorkout = filteredTotalWorkouts > 0 
    ? (filteredTotalSets / filteredTotalWorkouts).toFixed(1)
    : '0.0';
  
  // Calculate consistency (% of expected workouts completed in filtered range)
  // Use user's streak target if available, otherwise default to 4 workouts per week
  const targetWorkoutsPerWeek = streak?.target_days_per_week || 4;
  const expectedWorkouts = (parseInt(dateRange) / 7) * targetWorkoutsPerWeek;
  const consistency = expectedWorkouts > 0
    ? Math.min(100, Math.round((filteredTotalWorkouts / expectedWorkouts) * 100))
    : 0;

  // Milestone data - based on real stats with smart increments
  const totalReps = summary?.totalReps || 0;
  const totalWeight = Math.round(convertWeight(summary?.totalVolume || 0, 'lbs'));
  
  // Smart reps milestone: use smaller increments for lower numbers
  const getRepsIncrement = (reps: number) => {
    if (reps < 10000) return 1000;      // 1K increments up to 10K
    if (reps < 50000) return 5000;      // 5K increments up to 50K
    return 10000;                        // 10K increments after 50K
  };
  const repsIncrement = getRepsIncrement(totalReps);
  const repsNextMilestone = Math.ceil(totalReps / repsIncrement) * repsIncrement || repsIncrement;
  
  // Smart weight milestone: adjust based on unit and current progress
  const getWeightIncrement = (weight: number, unit: string) => {
    if (unit === 'kg') {
      if (weight < 50000) return 10000;   // 10K kg increments up to 50K
      if (weight < 200000) return 25000;  // 25K kg increments up to 200K
      return 50000;                       // 50K kg increments after 200K
    } else {
      if (weight < 100000) return 25000;  // 25K lbs increments up to 100K
      if (weight < 500000) return 50000;  // 50K lbs increments up to 500K
      return 100000;                      // 100K lbs increments after 500K
    }
  };
  const weightIncrement = getWeightIncrement(totalWeight, preferences.weightUnit);
  const weightNextMilestone = Math.ceil(totalWeight / weightIncrement) * weightIncrement || weightIncrement;

  const handleStartStreaks = () => {
    setShowStreakSetup(true);
  };

  const handleSetupStreak = async () => {
    // Validate target days
    if (targetDays < 1 || targetDays > 7 || !Number.isInteger(targetDays)) {
      toast({
        title: 'Invalid Goal',
        description: 'Please enter a number between 1 and 7 days per week.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newStreak = await startStreak(targetDays);
      setStreak(newStreak);
      setShowStreakSetup(false);
      toast({
        title: 'Streak Started!',
        description: `Your ${targetDays} days/week goal is now active.`,
      });
    } catch (err: any) {
      logger.error('Failed to start streak', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to start streak. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <PageHeader 
            title="Stats" 
            subtitle="Track your progress and streaks"
          />

          <Tabs defaultValue="statistics" className="animate-slide-up">
            <TabsList className="mb-6 w-full grid grid-cols-2">
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="streaks">Streaks</TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              {loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading stats...</p>
                </div>
              )}
              
              {error && (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              
              {!loading && !error && summary && (
                <>
                  {/* Date Range and Period Selectors */}
                  <div className="flex gap-4 justify-end flex-wrap">
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 Days (Daily)</SelectItem>
                        <SelectItem value="90">Last 90 Days (Weekly)</SelectItem>
                        <SelectItem value="180">Last 6 Months (Weekly)</SelectItem>
                        <SelectItem value="365">Last Year (Monthly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Card className="card-elevated">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Workouts</p>
                            <p className="text-2xl font-bold">{filteredTotalWorkouts}</p>
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

              {/* Charts Grid - 2 columns on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volume Over Time Chart */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Training Volume Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={volumeData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return period === 'month' 
                              ? date.toLocaleDateString('en-US', { month: 'short' })
                              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          width={60}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                          formatter={(value: any) => [`${value} ${preferences.weightUnit}`, 'Volume']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', r: 4 }}
                          activeDot={{ r: 6 }}
                          name={`Volume (${preferences.weightUnit})`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Workout Frequency Chart */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Workout Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={workoutFrequencyData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return period === 'month' 
                              ? date.toLocaleDateString('en-US', { month: 'short' })
                              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          width={40}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar 
                          dataKey="workouts" 
                          fill="#8B5CF6" 
                          radius={[8, 8, 0, 0]}
                          name="Workouts"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Muscle Group Distribution */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Muscle Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {muscleGroupData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                        <Target className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm md:text-base text-center px-4">No workout data yet. Complete workouts to see your muscle group breakdown!</p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={muscleGroupData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={false}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="sets"
                            >
                              {muscleGroupData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                          {muscleGroupData.map((muscle) => (
                            <div key={muscle.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: muscle.color }}></div>
                              <span className="text-xs md:text-sm text-muted-foreground truncate">{muscle.name}: {muscle.sets}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Personal Record Progression */}
                <Card className="card-elevated">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="text-base md:text-lg">PR Progression</CardTitle>
                      <Select value={selectedExerciseForPR} onValueChange={setSelectedExerciseForPR}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Exercises</SelectItem>
                          {availableExercises.slice(0, 4).map((exercise) => (
                            <SelectItem key={exercise} value={exercise}>{exercise}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {prProgressionData.length === 0 || personalRecords.length === 0 ? (
                      <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                        <p className="text-sm">Complete workouts to see PR progression</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={prProgressionData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            width={60}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                            labelStyle={{ color: '#F3F4F6' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          {(selectedExerciseForPR === 'all' ? personalRecords.slice(0, 4) : personalRecords.filter(pr => pr.exercise === selectedExerciseForPR)).map((pr, idx) => {
                            const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'];
                            return (
                              <Line 
                                key={pr.exercise}
                                type="monotone" 
                                dataKey={pr.exercise} 
                                stroke={colors[idx % colors.length]} 
                                strokeWidth={2}
                                dot={{ fill: colors[idx % colors.length], r: 3 }}
                                name={pr.exercise}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Workout Duration Trends */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Workout Duration Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={durationData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return period === 'month' 
                              ? date.toLocaleDateString('en-US', { month: 'short' })
                              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          width={50}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                          formatter={(value: any) => [`${value} min`, 'Duration']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="duration" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Avg Duration (min)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Average Sets per Workout (Workout Intensity) */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Workout Intensity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={avgSetsData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return period === 'month' 
                              ? date.toLocaleDateString('en-US', { month: 'short' })
                              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          width={40}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar 
                          dataKey="avgSets" 
                          fill="#EC4899" 
                          radius={[8, 8, 0, 0]}
                          name="Avg Sets per Workout"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Milestone Counters */}
                <Card className="card-elevated lg:col-span-2 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Total Reps */}
                      <div className="relative space-y-6">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                              <circle
                                cx="50%"
                                cy="50%"
                                r="60"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="none"
                                className="text-muted/30"
                              />
                              <circle
                                cx="50%"
                                cy="50%"
                                r="60"
                                stroke="url(#repsGradient)"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 60}`}
                                strokeDashoffset={`${2 * Math.PI * 60 * (1 - (totalReps / repsNextMilestone))}`}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                              />
                              <defs>
                                <linearGradient id="repsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#3B82F6" />
                                  <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Zap className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2 animate-pulse" />
                              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                {totalReps.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">reps</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-medium">Total Reps Completed</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="text-muted-foreground">Next milestone</span>
                              <span className="font-bold text-primary">{formatLargeNumber(repsNextMilestone)}</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-1000 animate-pulse"
                                style={{ 
                                  width: `${(totalReps / repsNextMilestone) * 100}%`,
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 2s infinite'
                                }}
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground font-medium">
                              <span className="text-primary font-bold">{formatLargeNumber(repsNextMilestone - totalReps)}</span> reps remaining
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {Math.min(100, ((totalReps / repsNextMilestone) * 100)).toFixed(1)}% Complete
                          </div>
                        </div>
                      </div>

                      {/* Total Weight */}
                      <div className="relative space-y-6">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                              <circle
                                cx="50%"
                                cy="50%"
                                r="60"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="none"
                                className="text-muted/30"
                              />
                              <circle
                                cx="50%"
                                cy="50%"
                                r="60"
                                stroke="url(#weightGradient)"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 60}`}
                                strokeDashoffset={`${2 * Math.PI * 60 * (1 - (totalWeight / weightNextMilestone))}`}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                              />
                              <defs>
                                <linearGradient id="weightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#8B5CF6" />
                                  <stop offset="100%" stopColor="#EC4899" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Trophy className="h-6 w-6 md:h-8 md:w-8 text-accent mb-2 animate-pulse" />
                              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent">
                                {formatLargeNumber(totalWeight)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{preferences.weightUnit}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-center space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <Medal className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-medium">Total Weight Lifted</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="text-muted-foreground">Next milestone</span>
                              <span className="font-bold text-accent">{formatLargeNumber(weightNextMilestone)} {preferences.weightUnit}</span>
                            </div>
                            <div className="h-2 bg-background rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full bg-gradient-to-r from-accent via-pink-500 to-accent rounded-full transition-all duration-1000 animate-pulse"
                                style={{ 
                                  width: `${(totalWeight / weightNextMilestone) * 100}%`,
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 2s infinite'
                                }}
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground font-medium">
                              <span className="text-accent font-bold">{formatLargeNumber(weightNextMilestone - totalWeight)}</span> {preferences.weightUnit} remaining
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            {Math.min(100, ((totalWeight / weightNextMilestone) * 100)).toFixed(1)}% Complete
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Records */}
              <Card className="card-elevated bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Award className="h-5 w-5 text-amber-500" />
                    Personal Records (Estimated 1RM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {personalRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm md:text-base">No personal records yet. Complete workouts to track your progress!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {personalRecords.map((record, index) => (
                        <div
                          key={index}
                          className="relative flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 border border-muted hover:border-primary/50 group hover:scale-[1.02] hover:shadow-lg"
                        >
                          {/* Icon badge */}
                          <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 group-hover:scale-110 transition-transform flex-shrink-0">
                            <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                          </div>
                          
                          {/* Exercise info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base md:text-lg truncate">{record.exercise}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground">{record.date}</p>
                          </div>
                          {/* Weight and reps */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                              {record.weight}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground font-medium">{preferences.weightUnit}</p>
                          </div>
                          
                          {/* Sparkle effect on hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-500 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </>
              )}
            </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading streaks...</p>
              </div>
            ) : !streak ? (
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
                      <h2 className="text-4xl font-bold mb-2">{streak.current_streak}</h2>
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
                        {streak.workouts_this_week} / {streak.target_days_per_week} days
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (streak.workouts_this_week / streak.target_days_per_week) * 100)}%`,
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
                          <p className="text-2xl font-bold">{streak.target_days_per_week} days</p>
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
                          <p className="text-2xl font-bold">{streak.longest_streak} days</p>
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
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty input for user to type
                  if (value === '') {
                    setTargetDays(1);
                    return;
                  }
                  // Parse and validate
                  const num = parseInt(value);
                  if (!isNaN(num) && num >= 1 && num <= 7) {
                    setTargetDays(num);
                  }
                }}
                onKeyPress={(e) => {
                  // Only allow digits 1-7
                  if (!/[1-7]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="text-center text-lg"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Enter a number between 1 and 7
              </p>
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
      </div>
    </Layout>
  );
};

export default Stats;
