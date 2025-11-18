import { Calendar, Clock, Dumbbell, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { getWorkoutHistory, SavedWorkout } from '@/lib/workoutStorage';
import { useEffect, useState } from 'react';

const History = () => {
  const [workoutHistory, setWorkoutHistory] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
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

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Workout History</h1>
          <p className="text-muted-foreground">Review your past sessions</p>
        </div>

        {/* History List */}
        <div className="space-y-4 animate-slide-up">
          {workoutHistory.map((workout, index) => (
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
          ))}
        </div>

        {/* Workout Details Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
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
    </Layout>
  );
};

export default History;
