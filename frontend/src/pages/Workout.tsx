import { useState, useEffect } from 'react';
import { Plus, X, Check, Clock, Pause, Play, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { saveWorkout, formatWorkoutDate } from '@/lib/workoutStorage';
import { updateStreakOnWorkout } from '@/lib/streakStorage';
import PageHeader from '@/components/PageHeader';

interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  reps: string;
  weight: string;
  rpe?: number;
  completed?: boolean;
  isWarmup?: boolean;
  isDropset?: boolean;
  isFailure?: boolean;
}

const Workout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  // Load template if provided
  useEffect(() => {
    const template = location.state?.template;
    if (template && template.exercises) {
      const templateExercises: Exercise[] = template.exercises.map((name: string, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        name,
        sets: [{ reps: '', weight: '', completed: false }],
      }));
      setExercises(templateExercises);
    }
  }, [location.state]);
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restDuration, setRestDuration] = useState(90); // default 90 seconds
  
  // RPE modal state
  const [rpeModalOpen, setRpeModalOpen] = useState(false);
  const [currentRpe, setCurrentRpe] = useState([5]);
  const [pendingSetId, setPendingSetId] = useState<{ exerciseId: string; setIndex: number } | null>(null);
  
  // Workout summary state
  const [showSummary, setShowSummary] = useState(false);
  const [workoutNumber, setWorkoutNumber] = useState(1);
  const [workoutName, setWorkoutName] = useState<string>('');

  const popularExercises = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
    'Pull-ups', 'Rows', 'Bicep Curls', 'Tricep Extensions'
  ];

  const motivationalMessages = [
    "You smashed it today!",
    "Consistency is power!",
    "Great work — every rep counts!",
    "Another step closer to your goals!",
    "Strength built, one workout at a time!",
    "You showed up and crushed it!"
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused && !showSummary) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, showSummary]);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimerActive && restSecondsRemaining > 0) {
      interval = setInterval(() => {
        setRestSecondsRemaining(prev => {
          if (prev <= 1) {
            setRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimerActive, restSecondsRemaining]);

  // Load workout count from localStorage
  useEffect(() => {
    const count = parseInt(localStorage.getItem('workoutCount') || '0');
    setWorkoutNumber(count + 1);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addExercise = (name: string) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name,
      sets: [{ reps: '', weight: '', completed: false }]
    };
    setExercises([...exercises, newExercise]);
    setIsAddingExercise(false);
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', completed: false }] }
        : ex
    ));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? {
            ...ex,
            sets: ex.sets.map((set, idx) => 
              idx === setIndex ? { ...set, [field]: value } : set
            )
          }
        : ex
    ));
  };

  const completeSet = (exerciseId: string, setIndex: number) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const set = exercise?.sets[setIndex];
    
    if (!set?.reps || !set?.weight) {
      toast({
        title: "Incomplete Set",
        description: "Please enter reps and weight before completing the set.",
        variant: "destructive"
      });
      return;
    }

    // Mark set as completed
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? {
            ...ex,
            sets: ex.sets.map((s, idx) => 
              idx === setIndex ? { ...s, completed: true } : s
            )
          }
        : ex
    ));

    // Start rest timer
    if (!set.isWarmup) {
      setRestSecondsRemaining(restDuration);
      setRestTimerActive(true);
    }

    // Open RPE modal
    setPendingSetId({ exerciseId, setIndex });
    setCurrentRpe([5]);
    setRpeModalOpen(true);
  };

  const saveRpe = () => {
    if (!pendingSetId) return;

    setExercises(exercises.map(ex => 
      ex.id === pendingSetId.exerciseId 
        ? {
            ...ex,
            sets: ex.sets.map((set, idx) => 
              idx === pendingSetId.setIndex ? { ...set, rpe: currentRpe[0] } : set
            )
          }
        : ex
    ));

    setRpeModalOpen(false);
    setPendingSetId(null);
    toast({
      title: "RPE Saved",
      description: `Logged RPE of ${currentRpe[0]} for this set.`
    });
  };

  const toggleSetType = (exerciseId: string, setIndex: number, type: 'warmup' | 'dropset' | 'failure') => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? {
            ...ex,
            sets: ex.sets.map((set, idx) => {
              if (idx === setIndex) {
                if (type === 'warmup') return { ...set, isWarmup: !set.isWarmup };
                if (type === 'dropset') return { ...set, isDropset: !set.isDropset };
                if (type === 'failure') return { ...set, isFailure: !set.isFailure };
              }
              return set;
            })
          }
        : ex
    ));
  };

  const calculateTotalWeight = () => {
    return exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        const reps = parseInt(set.reps) || 0;
        const weight = parseFloat(set.weight) || 0;
        return exerciseTotal + (reps * weight);
      }, 0);
    }, 0);
  };

  const finishWorkout = () => {
    // Save workout count
    localStorage.setItem('workoutCount', workoutNumber.toString());
    
    // Show summary
    setShowSummary(true);
  };

  const completeSummary = () => {
    const totalVolume = calculateTotalWeight();
    const finalName = workoutName || `Workout – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    // Update streak
    updateStreakOnWorkout();
    
    // Save the workout to history
    saveWorkout({
      name: finalName,
      date: formatWorkoutDate(Date.now()),
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets
      })),
      duration: elapsedSeconds,
      totalVolume: totalVolume
    });
    
    toast({
      title: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
      description: "Your workout has been saved.",
    });
    
    navigate('/dashboard');
  };

  if (showSummary) {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    const totalWeight = calculateTotalWeight();

    return (
      <Layout>
        <div className="w-full min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-4">
          <Card className="w-full max-w-md animate-fade-in card-elevated">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">{randomMessage}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="p-6 bg-primary-dark/20 rounded-xl">
                  <p className="text-muted-foreground mb-2">Workout #{workoutNumber}</p>
                  <p className="text-4xl font-bold text-primary">{formatTime(elapsedSeconds)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Duration</p>
                </div>

                <div className="p-6 bg-card/50 rounded-xl flex items-center justify-center gap-3">
                  <Dumbbell className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-3xl font-bold">{totalWeight.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total lbs lifted</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                    <p className="text-sm text-muted-foreground">Exercises</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Sets</p>
                  </div>
                </div>
              </div>

              <Button onClick={completeSummary} className="w-full" size="lg">
                <Check className="h-5 w-5 mr-2" />
                Finish
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header with Timer */}
        <div className="mb-6 space-y-4 animate-slide-up">
          <PageHeader 
            title="Active Workout" 
            subtitle="Track your sets and reps"
          >
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <X className="h-5 w-5" />
            </Button>
          </PageHeader>

          {/* Timer Card */}
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold font-mono">{formatTime(elapsedSeconds)}</p>
                    <p className="text-xs text-muted-foreground">Time Elapsed</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-10 w-10"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rest Timer Card */}
          {restTimerActive && (
            <Card className="card-elevated bg-accent/10 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-2xl font-bold font-mono text-accent">{formatTime(restSecondsRemaining)}</p>
                      <p className="text-xs text-muted-foreground">Rest Time Remaining</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestTimerActive(false)}
                  >
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Exercises */}
        <div className="space-y-4 mb-6">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="card-elevated animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exercise.sets.map((set, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {idx + 1}
                        </span>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', e.target.value)}
                          className="rounded-xl"
                          disabled={set.completed}
                        />
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, idx, 'weight', e.target.value)}
                          className="rounded-xl"
                          disabled={set.completed}
                        />
                        <span className="text-sm text-muted-foreground">lbs</span>
                        {!set.completed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => completeSet(exercise.id, idx)}
                            className="shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="shrink-0 w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      {/* Set Type Badges and RPE */}
                      <div className="ml-11 flex flex-wrap gap-2 items-center">
                        {/* Set Type Toggles */}
                        {!set.completed && (
                          <div className="flex gap-1">
                            <Button
                              variant={set.isWarmup ? "default" : "outline"}
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => toggleSetType(exercise.id, idx, 'warmup')}
                            >
                              Warmup
                            </Button>
                            <Button
                              variant={set.isDropset ? "default" : "outline"}
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => toggleSetType(exercise.id, idx, 'dropset')}
                            >
                              Dropset
                            </Button>
                            <Button
                              variant={set.isFailure ? "default" : "outline"}
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => toggleSetType(exercise.id, idx, 'failure')}
                            >
                              Failure
                            </Button>
                          </div>
                        )}
                        
                        {/* Display badges for completed sets */}
                        {set.completed && (
                          <>
                            {set.isWarmup && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                Warmup
                              </span>
                            )}
                            {set.isDropset && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                Dropset
                              </span>
                            )}
                            {set.isFailure && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                Failure
                              </span>
                            )}
                          </>
                        )}
                        
                        {/* RPE Display */}
                        {set.rpe !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            set.rpe <= 4 ? 'bg-green-500/20 text-green-400' :
                            set.rpe <= 7 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            RPE: {set.rpe}/10
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSet(exercise.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Exercise */}
        {isAddingExercise ? (
          <Card className="card-elevated animate-scale-in">
            <CardHeader>
              <CardTitle className="text-lg">Select Exercise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {popularExercises.map((exercise) => (
                  <Button
                    key={exercise}
                    variant="outline"
                    onClick={() => addExercise(exercise)}
                    className="justify-start"
                  >
                    {exercise}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsAddingExercise(false)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAddingExercise(true)}
            className="w-full mb-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise
          </Button>
        )}

        {/* Finish Workout */}
        {exercises.length > 0 && (
          <Button onClick={finishWorkout} className="w-full" size="lg">
            <Check className="h-5 w-5 mr-2" />
            Finish Workout
          </Button>
        )}

        {/* RPE Modal */}
        <Drawer open={rpeModalOpen} onOpenChange={setRpeModalOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Rate Your Effort (RPE)</DrawerTitle>
            </DrawerHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Easy</span>
                  <span className="text-2xl font-bold text-primary">{currentRpe[0]}</span>
                  <span>Max Effort</span>
                </div>
                <Slider
                  value={currentRpe}
                  onValueChange={setCurrentRpe}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={saveRpe} className="w-full">
                Save RPE
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        </div>
      </div>
    </Layout>
  );
};

export default Workout;
