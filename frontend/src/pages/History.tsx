import { Calendar, Clock, Dumbbell, X, Filter, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import { getWorkoutHistory, SavedWorkout } from '@/lib/workoutStorage';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';

const History = () => {
  const [workoutHistory, setWorkoutHistory] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [exerciseFilter, setExerciseFilter] = useState<string>('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  useEffect(() => {
    // Load workout history (mock data seeding removed - will be replaced with real API)
    const savedWorkouts = getWorkoutHistory();
    setWorkoutHistory(savedWorkouts);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const handleWorkoutClick = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setIsDialogOpen(true);
  };

  // Filter and sort workouts
  const filteredAndSortedWorkouts = workoutHistory
    .filter(workout => {
      // Date range filter
      if (dateRange !== 'all') {
        const workoutDate = new Date(workout.date);
        const now = new Date();
        const daysAgo = parseInt(dateRange);
        const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
        if (workoutDate < cutoffDate) return false;
      }
      
      // Template filter (mock - would need template info in workout data)
      if (templateFilter !== 'all' && workout.name !== templateFilter) {
        return false;
      }
      
      // Exercise filter
      if (exerciseFilter.trim()) {
        return workout.exercises.some(ex => 
          ex.name.toLowerCase().includes(exerciseFilter.toLowerCase())
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'volume-desc':
          return b.totalVolume - a.totalVolume;
        case 'volume-asc':
          return a.totalVolume - b.totalVolume;
        case 'duration-desc':
          return b.duration - a.duration;
        case 'duration-asc':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });
  
  // Get unique workout names for template filter
  const uniqueWorkoutNames = Array.from(new Set(workoutHistory.map(w => w.name)));

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                {uniqueWorkoutNames.map((name) => (
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

            <Input
              placeholder="Search exercises..."
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4 animate-slide-up">
          {filteredAndSortedWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No workouts found matching your filters.</p>
            </div>
          ) : (
            filteredAndSortedWorkouts.map((workout, index) => (
            <Card 
              key={index} 
              className="card-elevated hover-scale cursor-pointer"
              onClick={() => handleWorkoutClick(workout)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{workout.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{workout.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Volume</p>
                    <p className="text-lg font-bold text-primary">{workout.totalVolume.toLocaleString()} lbs</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {workout.exercises.map((exercise, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-muted rounded-full text-sm"
                      >
                        {exercise.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(workout.duration)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>

        {/* Workout Details Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div>
                <DialogTitle className="text-2xl mb-2">{selectedWorkout?.name}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedWorkout?.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedWorkout && formatDuration(selectedWorkout.duration)}</span>
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
                    {selectedWorkout?.totalVolume.toLocaleString()} lbs
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Exercises</p>
                  <p className="text-2xl font-bold">{selectedWorkout?.exercises.length}</p>
                </div>
              </div>

              <Separator />

              {/* Exercise Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Exercise Breakdown
                </h3>
                
                {selectedWorkout?.exercises.map((exercise, exIdx) => (
                  <div key={exIdx} className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-base">{exercise.name}</h4>
                    
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div 
                          key={setIdx} 
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
                              <span className="text-muted-foreground"> lbs</span>
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
                      Total: {exercise.sets.length} sets
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default History;
