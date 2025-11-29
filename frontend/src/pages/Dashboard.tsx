import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, Flame, Clock, Dumbbell, X, Activity, Award, Zap, History as HistoryIcon, Library, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { StartWorkoutDialog } from '@/components/StartWorkoutDialog';
import { TemplatePickerDialog } from '@/components/TemplatePickerDialog';
import { getWorkoutHistory, getWorkoutStats, formatWorkoutDate, getRelativeDate, type WorkoutHistoryItem, type WorkoutStats } from '@/services/workoutHistoryService';
import PageHeader from '@/components/PageHeader';
import { useWorkout } from '@/contexts/WorkoutContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/core/constants/AppConstants';
import { storageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';
import { templateService, WorkoutTemplate as APIWorkoutTemplate } from '@/services/templateService';

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: string[];
  duration: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { preferences, convertWeight } = usePreferences();
  const { activeWorkout, hasActiveWorkout, endWorkout } = useWorkout();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistoryItem | null>(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const isWorkoutActive = location.state?.workoutActive || false;

  // Motivational quotes array
  const motivationalQuotes = [
    "The only bad workout is the one that didn't happen.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Don't limit your challenges. Challenge your limits.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "The body achieves what the mind believes.",
    "Push yourself because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Wake up with determination. Go to bed with satisfaction.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "The difference between try and triumph is a little umph.",
  ];

  // Select random quote on mount
  const [dailyQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  });

  useEffect(() => {
    // Load templates from API
    loadTemplatesFromAPI();
    
    // Load workout history and stats from API
    loadDashboardData();
  }, [location.key, location.state?.refreshData]); // Use location.key to reload on navigation but not on every pathname change

  const loadTemplatesFromAPI = async () => {
    try {
      const apiTemplates = await templateService.getAllTemplates();
      
      // Convert API format to Dashboard format
      const dashboardTemplates: WorkoutTemplate[] = apiTemplates.map((t: APIWorkoutTemplate) => ({
        id: String(t.id),
        name: t.name,
        exercises: t.template_exercises?.map(ex => ex.exercise_name) || [],
        duration: `${(t.template_exercises?.length || 0) * 5} min` // Estimate 5 min per exercise
      }));
      
      setTemplates(dashboardTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback to empty array instead of showing error toast
      setTemplates([]);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // If coming from finished workout, force fresh data (bypass cache)
      const shouldForceRefresh = location.state?.refreshData === true;
      
      const [historyData, statsData] = await Promise.all([
        getWorkoutHistory(5, 0, shouldForceRefresh), // Force refresh if needed
        getWorkoutStats(shouldForceRefresh) // Force refresh if needed
      ]);
      setWorkoutHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load workout data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = stats ? [
    { label: 'Total Workouts', value: stats.total_workouts.toString(), icon: Target, color: 'text-primary' },
    { label: 'Current Streak', value: `${stats.current_streak} ${stats.current_streak === 1 ? 'day' : 'days'}`, icon: Flame, color: 'text-accent' },
    { label: 'Total Volume', value: stats.total_volume >= 1000 ? `${(convertWeight(stats.total_volume, 'lbs') / 1000).toFixed(1)}K ${preferences.weightUnit}` : `${Math.round(convertWeight(stats.total_volume, 'lbs'))} ${preferences.weightUnit}`, icon: TrendingUp, color: 'text-chart-gold' },
  ] : [];

  const handleWorkoutClick = (workout: WorkoutHistoryItem) => {
    setSelectedWorkout(workout);
    setShowWorkoutDetails(true);
  };

  const handleStartWorkout = () => {
    // Check if there's already an active workout
    if (hasActiveWorkout()) {
      toast({
        title: "Workout Already Active",
        description: "You have an active workout in progress. Please finish it first or click the indicator at the top to resume.",
        variant: "destructive"
      });
      return;
    }
    setShowStartDialog(true);
  };

  const handleStartEmpty = () => {
    setShowStartDialog(false);
    // Clear any existing workout draft before starting fresh
    endWorkout();
    // Small delay to ensure dialog unmounts and cleans up scroll lock before navigation
    setTimeout(() => {
      navigate('/workout', { state: { template: null, clearDraft: true } });
    }, 50);
  };

  const handleStartFromTemplate = () => {
    setShowStartDialog(false);
    // Small delay before showing next dialog
    setTimeout(() => {
      setShowTemplatePicker(true);
    }, 100);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setShowTemplatePicker(false);
    // Clear any existing workout draft before starting from template
    endWorkout();
    // Small delay to ensure dialog unmounts and cleans up scroll lock before navigation
    setTimeout(() => {
      navigate('/workout', { state: { template, clearDraft: true } });
    }, 50);
  };

  // Don't show dashboard if workout is active
  if (isWorkoutActive) {
    return null;
  }

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {/* Page Header - All Devices */}
          <PageHeader 
            title="Dashboard" 
            subtitle="Welcome back! Ready to crush your goals?"
          />

          {/* Motivation Card */}
          <Card className="card-elevated bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Today's Motivation</h2>
                  <p className="text-xs text-muted-foreground">Keep pushing forward</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-accent">
                <p className="text-sm italic text-foreground/90">
                  "{dailyQuote}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats - Compact Grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 animate-slide-up">
            {loading ? (
              <div className="col-span-3 flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              statsDisplay.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="card-elevated hover:scale-105 transition-transform">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                          <Icon className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div>
                          <p className="text-xl md:text-2xl font-bold mb-0.5">{stat.value}</p>
                          <p className="text-xs md:text-sm text-muted-foreground leading-tight">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="animate-slide-up flex justify-center md:justify-start">
            <Button 
              size="lg" 
              className="w-auto px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg"
              onClick={handleStartWorkout}
            >
              <Plus className="mr-2 h-5 w-5" />
              Start New Workout
            </Button>
          </div>

          {/* Recent Workouts */}
          <Card className="card-elevated animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Workouts</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : workoutHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No workouts yet. Start your first workout!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workoutHistory.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleWorkoutClick(workout)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{workout.workout_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {workout.exercises_count || 0} exercises
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.round(workout.elapsed_seconds / 60)} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{getRelativeDate(workout.start_time)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{Math.round(convertWeight(workout.total_volume || 0, 'lbs')).toLocaleString()} {preferences.weightUnit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Start Workout Dialog */}
          <StartWorkoutDialog
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          onStartEmpty={handleStartEmpty}
          onStartFromTemplate={handleStartFromTemplate}
        />

          {/* Template Picker Dialog */}
          <TemplatePickerDialog
            open={showTemplatePicker}
            onOpenChange={setShowTemplatePicker}
            templates={templates}
            onSelectTemplate={handleSelectTemplate}
          />

          {/* Workout Details Dialog - Simplified (redirects to history for full details) */}
          <Dialog open={showWorkoutDetails} onOpenChange={setShowWorkoutDetails}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedWorkout?.workout_name}</DialogTitle>
              </DialogHeader>
              {selectedWorkout && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">{Math.round(selectedWorkout.elapsed_seconds / 60)} min</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Volume</p>
                          <p className="text-2xl font-bold">{Math.round(convertWeight(selectedWorkout.total_volume || 0, 'lbs')).toLocaleString()} {preferences.weightUnit}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Exercises</p>
                          <p className="text-2xl font-bold">{selectedWorkout.exercises_count || 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Sets</p>
                          <p className="text-2xl font-bold">{selectedWorkout.total_sets || 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Want to see full exercise details?</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowWorkoutDetails(false);
                        navigate('/history');
                      }}
                    >
                      View in History
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
