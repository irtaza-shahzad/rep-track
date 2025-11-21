import { useState } from 'react';
import { TrendingUp, Calendar, Target, Flame, Award, Trophy, Medal, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '@/components/Layout';
import { getStreakConfig, initializeStreak, getCurrentWeekProgress } from '@/lib/streakStorage';
import PageHeader from '@/components/PageHeader';
import { usePreferences } from '@/contexts/PreferencesContext';

const Stats = () => {
  const [streakConfig, setStreakConfig] = useState(getStreakConfig());
  const [showStreakSetup, setShowStreakSetup] = useState(false);
  const [targetDays, setTargetDays] = useState(4);
  const [dateRange, setDateRange] = useState('30');
  const [selectedExerciseForPR, setSelectedExerciseForPR] = useState<string>('all');
  const { preferences, convertWeight } = usePreferences();
  
  // Mock data for Volume Over Time (last 12 weeks)
  const volumeData = [
    { week: 'Week 1', volume: 8500 },
    { week: 'Week 2', volume: 9200 },
    { week: 'Week 3', volume: 8800 },
    { week: 'Week 4', volume: 10100 },
    { week: 'Week 5', volume: 9500 },
    { week: 'Week 6', volume: 11200 },
    { week: 'Week 7', volume: 10800 },
    { week: 'Week 8', volume: 11500 },
    { week: 'Week 9', volume: 11000 },
    { week: 'Week 10', volume: 12100 },
    { week: 'Week 11', volume: 12500 },
    { week: 'Week 12', volume: 13200 },
  ];

  // Mock data for Workout Frequency (last 8 weeks)
  const frequencyData = [
    { week: 'W1', workouts: 3 },
    { week: 'W2', workouts: 4 },
    { week: 'W3', workouts: 4 },
    { week: 'W4', workouts: 5 },
    { week: 'W5', workouts: 3 },
    { week: 'W6', workouts: 5 },
    { week: 'W7', workouts: 4 },
    { week: 'W8', workouts: 5 },
  ];

  // Mock data for Muscle Group Distribution
  const muscleGroupData = [
    { name: 'Chest', sets: 145, color: '#3B82F6' },
    { name: 'Back', sets: 168, color: '#8B5CF6' },
    { name: 'Legs', sets: 223, color: '#10B981' },
    { name: 'Shoulders', sets: 112, color: '#F59E0B' },
    { name: 'Arms', sets: 98, color: '#EF4444' },
    { name: 'Core', sets: 67, color: '#EC4899' },
  ];

  // Mock data for PR Progression (multiple exercises)
  const prProgressionData = [
    { date: 'Jan 1', benchPress: 185, squat: 225, deadlift: 275, overheadPress: 115 },
    { date: 'Jan 15', benchPress: 190, squat: 235, deadlift: 285, overheadPress: 120 },
    { date: 'Feb 1', benchPress: 195, squat: 245, deadlift: 295, overheadPress: 120 },
    { date: 'Feb 15', benchPress: 200, squat: 255, deadlift: 305, overheadPress: 125 },
    { date: 'Mar 1', benchPress: 205, squat: 265, deadlift: 315, overheadPress: 130 },
    { date: 'Mar 15', benchPress: 210, squat: 275, deadlift: 325, overheadPress: 135 },
    { date: 'Apr 1', benchPress: 215, squat: 285, deadlift: 345, overheadPress: 140 },
    { date: 'Apr 15', benchPress: 220, squat: 295, deadlift: 365, overheadPress: 145 },
    { date: 'May 1', benchPress: 225, squat: 305, deadlift: 385, overheadPress: 150 },
    { date: 'May 15', benchPress: 225, squat: 315, deadlift: 405, overheadPress: 155 },
  ];

  // Mock data for Workout Duration Trends
  const durationData = [
    { week: 'Week 1', duration: 48 },
    { week: 'Week 2', duration: 52 },
    { week: 'Week 3', duration: 47 },
    { week: 'Week 4', duration: 55 },
    { week: 'Week 5', duration: 50 },
    { week: 'Week 6', duration: 58 },
    { week: 'Week 7', duration: 53 },
    { week: 'Week 8', duration: 56 },
    { week: 'Week 9', duration: 51 },
    { week: 'Week 10', duration: 54 },
    { week: 'Week 11', duration: 49 },
    { week: 'Week 12', duration: 52 },
  ];

  // Mock data for Average Sets per Workout (Workout Intensity)
  const avgSetsData = [
    { week: 'Week 1', avgSets: 18 },
    { week: 'Week 2', avgSets: 20 },
    { week: 'Week 3', avgSets: 19 },
    { week: 'Week 4', avgSets: 22 },
    { week: 'Week 5', avgSets: 21 },
    { week: 'Week 6', avgSets: 24 },
    { week: 'Week 7', avgSets: 23 },
    { week: 'Week 8', avgSets: 25 },
    { week: 'Week 9', avgSets: 24 },
    { week: 'Week 10', avgSets: 26 },
    { week: 'Week 11', avgSets: 25 },
    { week: 'Week 12', avgSets: 27 },
  ];

  // Milestone data
  const totalReps = 12847;
  const totalWeight = 1456320; // in lbs
  const repsNextMilestone = 15000;
  const weightNextMilestone = 1500000;
  
  const progressData = [
    { month: 'Jan', volume: 8500 },
    { month: 'Feb', volume: 9200 },
    { month: 'Mar', volume: 10100 },
    { month: 'Apr', volume: 11500 },
    { month: 'May', volume: 12500 },
  ];

  // Personal records with converted weights
  const personalRecords = [
    { exercise: 'Bench Press', weight: convertWeight(225, 'lbs'), date: 'May 8', reps: 5 },
    { exercise: 'Squat', weight: convertWeight(315, 'lbs'), date: 'May 5', reps: 3 },
    { exercise: 'Deadlift', weight: convertWeight(405, 'lbs'), date: 'Apr 28', reps: 1 },
    { exercise: 'Overhead Press', weight: convertWeight(155, 'lbs'), date: 'May 10', reps: 5 },
    { exercise: 'Pull-ups', weight: convertWeight(45, 'lbs'), date: 'May 3', reps: 8 },
  ];

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
              {/* Date Range Selector */}
              <div className="flex justify-end">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
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

              {/* Charts Grid - 2 columns on large screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volume Over Time Chart */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Training Volume Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="week" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          label={{ value: `Volume (${preferences.weightUnit})`, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', r: 5 }}
                          activeDot={{ r: 7 }}
                          name={`Volume (${preferences.weightUnit})`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Workout Frequency Chart */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Workout Frequency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={frequencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="week" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          label={{ value: 'Workouts', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="workouts" 
                          fill="#8B5CF6" 
                          radius={[8, 8, 0, 0]}
                          name="Workouts per Week"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Muscle Group Distribution */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Muscle Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={muscleGroupData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
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
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {muscleGroupData.map((muscle) => (
                    <div key={muscle.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: muscle.color }}></div>
                      <span className="text-sm text-muted-foreground">{muscle.name}: {muscle.sets} sets</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

                {/* Personal Record Progression */}
                <Card className="card-elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Personal Record Progression</CardTitle>
                      <Select value={selectedExerciseForPR} onValueChange={setSelectedExerciseForPR}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Exercises</SelectItem>
                          <SelectItem value="benchPress">Bench Press</SelectItem>
                          <SelectItem value="squat">Squat</SelectItem>
                          <SelectItem value="deadlift">Deadlift</SelectItem>
                          <SelectItem value="overheadPress">Overhead Press</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={prProgressionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          label={{ value: `Weight (${preferences.weightUnit})`, angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                        />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend />
                    {(selectedExerciseForPR === 'all' || selectedExerciseForPR === 'benchPress') && (
                      <Line 
                        type="monotone" 
                        dataKey="benchPress" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        name="Bench Press"
                      />
                    )}
                    {(selectedExerciseForPR === 'all' || selectedExerciseForPR === 'squat') && (
                      <Line 
                        type="monotone" 
                        dataKey="squat" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                        name="Squat"
                      />
                    )}
                    {(selectedExerciseForPR === 'all' || selectedExerciseForPR === 'deadlift') && (
                      <Line 
                        type="monotone" 
                        dataKey="deadlift" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={{ fill: '#EF4444', r: 4 }}
                        name="Deadlift"
                      />
                    )}
                    {(selectedExerciseForPR === 'all' || selectedExerciseForPR === 'overheadPress') && (
                      <Line 
                        type="monotone" 
                        dataKey="overheadPress" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', r: 4 }}
                        name="Overhead Press"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

                {/* Workout Duration Trends */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Workout Duration Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={durationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="week" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                        />
                            <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="duration" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', r: 5 }}
                          activeDot={{ r: 7 }}
                          name="Avg Duration (min)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Average Sets per Workout (Workout Intensity) */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle>Workout Intensity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={avgSetsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="week" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          label={{ value: 'Avg Sets', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
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
                    <CardTitle className="flex items-center gap-2">
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
                            <svg className="w-40 h-40 transform -rotate-90">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-muted/30"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="url(#repsGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - (totalReps / repsNextMilestone))}`}
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
                              <Zap className="h-8 w-8 text-primary mb-2 animate-pulse" />
                              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Next milestone</span>
                              <span className="font-bold text-primary">{repsNextMilestone.toLocaleString()}</span>
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
                              <span className="text-primary font-bold">{(repsNextMilestone - totalReps).toLocaleString()}</span> reps remaining
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {((totalReps / repsNextMilestone) * 100).toFixed(1)}% Complete
                          </div>
                        </div>
                      </div>

                      {/* Total Weight */}
                      <div className="relative space-y-6">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            {/* Circular progress background */}
                            <svg className="w-40 h-40 transform -rotate-90">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-muted/30"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="url(#weightGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - (totalWeight / weightNextMilestone))}`}
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
                              <Trophy className="h-8 w-8 text-accent mb-2 animate-pulse" />
                              <p className="text-3xl font-bold bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent">
                                {(totalWeight / 1000).toFixed(1)}K
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
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Next milestone</span>
                              <span className="font-bold text-accent">{(weightNextMilestone / 1000).toFixed(0)}K {preferences.weightUnit}</span>
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
                              <span className="text-accent font-bold">{((weightNextMilestone - totalWeight) / 1000).toFixed(1)}K</span> {preferences.weightUnit} remaining
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            {((totalWeight / weightNextMilestone) * 100).toFixed(1)}% Complete
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
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    Personal Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {personalRecords.map((record, index) => (
                      <div
                        key={index}
                        className="relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-all duration-300 border border-muted hover:border-primary/50 group hover:scale-[1.02] hover:shadow-lg"
                      >
                        {/* Icon badge */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 group-hover:scale-110 transition-transform">
                          <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        
                        {/* Exercise info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{record.exercise}</h3>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        {/* Weight and reps */}
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {record.weight} {preferences.weightUnit}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">{record.reps} reps</p>
                        </div>
                        
                        {/* Sparkle effect on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Star className="h-4 w-4 text-amber-500 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
      </div>
    </Layout>
  );
};

export default Stats;
