import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, Flame, Clock, Dumbbell, X, Activity, Award, Zap, History as HistoryIcon, Library, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { StartWorkoutDialog } from '@/components/StartWorkoutDialog';
import { TemplatePickerDialog } from '@/components/TemplatePickerDialog';
import { getWorkoutHistory, SavedWorkout, formatWorkoutDate } from '@/lib/workoutStorage';
import PageHeader from '@/components/PageHeader';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/core/constants/AppConstants';
import { storageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';

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
  const { activeWorkout, hasActiveWorkout } = useWorkout();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
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
    // Load templates from localStorage
    const stored = storageAdapter.get<WorkoutTemplate[]>(STORAGE_KEYS.WORKOUT_TEMPLATES);
    setTemplates(stored || []);
    
    // Load workout history (mock data seeding removed - will be replaced with real API)
    setWorkoutHistory(getWorkoutHistory());
  }, []);

  const stats = [
    { label: 'Workouts This Week', value: '4', icon: Target, color: 'text-primary' },
    { label: 'Current Streak', value: '7 days', icon: Flame, color: 'text-accent' },
    { label: 'Total Volume', value: '12.5K lbs', icon: TrendingUp, color: 'text-chart-gold' },
  ];

  // Get last 5 workouts for recent section
  const recentWorkouts = workoutHistory.slice(0, 5);

  const getRelativeDate = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatWorkoutDate(timestamp);
  };

  const handleWorkoutClick = (workout: SavedWorkout) => {
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
    navigate('/workout', { state: { template: null } });
  };

  const handleStartFromTemplate = () => {
    setShowStartDialog(false);
    setShowTemplatePicker(true);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setShowTemplatePicker(false);
    navigate('/workout', { state: { template } });
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
            {stats.map((stat, index) => {
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
            })}
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
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No workouts yet. Start your first workout!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleWorkoutClick(workout)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{workout.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {workout.exercises.length} exercises
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.round(workout.duration / 60)} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{getRelativeDate(workout.timestamp)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{workout.totalVolume.toLocaleString()} lbs</p>
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

          {/* Workout Details Dialog */}
          <Dialog open={showWorkoutDetails} onOpenChange={setShowWorkoutDetails}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedWorkout?.name}</DialogTitle>
              </DialogHeader>
              {selectedWorkout && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">{Math.round(selectedWorkout.duration / 60)} min</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Volume</p>
                          <p className="text-2xl font-bold">{selectedWorkout.totalVolume.toLocaleString()} lbs</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Exercises</h3>
                    <div className="space-y-4">
                      {selectedWorkout.exercises.map((exercise, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <h4 className="font-medium mb-3">{exercise.name}</h4>
                            <div className="space-y-2">
                              {exercise.sets.map((set, setIdx) => (
                                <div key={setIdx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Set {setIdx + 1}</span>
                                  <span className="font-medium">
                                    {set.weight} lbs × {set.reps} reps
                                    {set.rpe && <span className="text-muted-foreground ml-2">RPE {set.rpe}</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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
