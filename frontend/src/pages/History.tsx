import { Calendar, Clock, Dumbbell, X, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { logger } from '@/lib/logger';
import { 
  getWorkoutHistory, 
  getWorkoutDetail,
  formatWorkoutDate,
  formatDuration,
  WorkoutHistoryItem,
  WorkoutDetail
} from '@/services/workoutHistoryService';

const History = () => {
  const { toast } = useToast();
  const { preferences, convertWeight } = usePreferences();
  const location = useLocation();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  useEffect(() => {
    loadWorkoutHistory();
  }, [location.key]); // Reload when navigation occurs

  const loadWorkoutHistory = async () => {
    try {
      setLoading(true);
      // Force refresh if coming from Dashboard with refresh flag
      const shouldForceRefresh = location.state?.refreshData === true;
      const data = await getWorkoutHistory(100, 0, shouldForceRefresh); // Load last 100 workouts
      setWorkoutHistory(data);
    } catch (error: any) {
      logger.error('Failed to load workout history', error);
      toast({
        title: 'Error Loading History',
        description: error.response?.data?.message || 'Failed to load workout history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutClick = async (workout: WorkoutHistoryItem) => {
    try {
      setDetailLoading(true);
      setIsDialogOpen(true);
      const detail = await getWorkoutDetail(workout.id);
      setSelectedWorkout(detail);
    } catch (error: any) {
      logger.error('Failed to load workout details', error);
      toast({
        title: 'Error Loading Details',
        description: error.response?.data?.message || 'Failed to load workout details',
        variant: 'destructive',
      });
      setIsDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter and sort workouts
  const filteredAndSortedWorkouts = workoutHistory
    .filter(workout => {
      // Date range filter
      if (dateRange !== 'all') {
        const workoutDate = new Date(workout.start_time);
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
        if (workoutDate < cutoffDate) return false;
      }
      
      // Template filter
      if (templateFilter !== 'all' && workout.workout_name !== templateFilter) {
        return false;
      }
      
      // Exercise filter - Note: Can't filter by exercise name in summary, would need to load details
      // Keeping the UI but it won't work without loading all workout details
      // For now, just return true
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.start_time - a.start_time;
        case 'date-asc':
          return a.start_time - b.start_time;
        case 'volume-desc':
          return (b.total_volume || 0) - (a.total_volume || 0);
        case 'volume-asc':
          return (a.total_volume || 0) - (b.total_volume || 0);
        case 'duration-desc':
          return b.elapsed_seconds - a.elapsed_seconds;
        case 'duration-asc':
          return a.elapsed_seconds - b.elapsed_seconds;
        default:
          return 0;
      }
    });
  
  // Get unique workout names for template filter
  const uniqueWorkoutNames = Array.from(new Set(workoutHistory.map(w => w.workout_name)));

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <PageHeader 
          title="Workout History" 
          subtitle="Review your past sessions"
        />

        {/* Filters */}
        <div className="mb-6 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Workout Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workouts</SelectItem>
                {uniqueWorkoutNames
                  .filter(name => !name.startsWith('Workout –') && !name.startsWith('Workout -')) // Filter out generic date-based names
                  .map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="volume-desc">Volume (Highest)</SelectItem>
                <SelectItem value="volume-asc">Volume (Lowest)</SelectItem>
                <SelectItem value="duration-desc">Duration (Longest)</SelectItem>
                <SelectItem value="duration-asc">Duration (Shortest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4 animate-slide-up">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No workouts found.</p>
              <p className="text-sm text-muted-foreground mt-2">Start your first workout to see it here!</p>
            </div>
          ) : (
            filteredAndSortedWorkouts.map((workout) => (
            <Card 
              key={workout.id} 
              className="card-elevated hover-scale cursor-pointer"
              onClick={() => handleWorkoutClick(workout)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{workout.workout_name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatWorkoutDate(workout.start_time)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Volume</p>
                    <p className="text-lg font-bold text-primary">
                      {workout.total_volume ? `${Math.round(convertWeight(workout.total_volume, 'lbs')).toLocaleString()} ${preferences.weightUnit}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{workout.exercises_count || 0} exercises</span>
                    <span>•</span>
                    <span>{workout.total_sets || 0} sets</span>
                    <span>•</span>
                    <span>{formatDuration(workout.elapsed_seconds)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>

        {/* Workout Details Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedWorkout ? (
              <>
                <DialogHeader>
                  <div>
                    <DialogTitle className="text-2xl mb-2">{selectedWorkout.workout_name}</DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatWorkoutDate(selectedWorkout.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(selectedWorkout.elapsed_seconds)}</span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                      <p className="text-2xl font-bold text-primary">
                        {selectedWorkout.total_volume ? `${Math.round(convertWeight(selectedWorkout.total_volume, 'lbs')).toLocaleString()} ${preferences.weightUnit}` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Exercises</p>
                      <p className="text-2xl font-bold">{selectedWorkout.exercises.length}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Exercise Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-primary" />
                      Exercise Breakdown
                    </h3>
                    
                    {selectedWorkout.exercises.map((exercise, exIdx) => (
                      <div key={exIdx} className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-base">{exercise.name}</h4>
                        
                        <div className="space-y-2">
                          {exercise.sets
                            .filter(set => set.completed) // Only show completed sets
                            .map((set, setIdx) => (
                            <div 
                              key={set.id} 
                              className="flex items-center justify-between bg-card/50 rounded-md p-3 border border-border/50"
                            >
                              <span className="text-sm font-medium text-muted-foreground">
                                Set {setIdx + 1}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm">
                                  <span className="font-semibold text-foreground">{set.reps}</span>
                                  <span className="text-muted-foreground"> reps</span>
                                </span>
                                <span className="text-sm">
                                  <span className="font-semibold text-foreground">{set.weight}</span>
                                  <span className="text-muted-foreground"> {preferences.weightUnit}</span>
                                </span>
                                {set.rpe && (
                                  <span className="text-sm">
                                    <span className="font-semibold text-primary">RPE {set.rpe}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Exercise Summary */}
                        <div className="pt-2 text-sm text-muted-foreground">
                          Total: {exercise.sets.filter(s => s.completed).length} sets
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default History;
