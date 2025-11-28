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
import { invalidateWorkoutCache } from '@/services/workoutHistoryService';
import * as liveWorkoutService from '@/services/liveWorkoutService';
import PageHeader from '@/components/PageHeader';
import { useWorkout } from '@/contexts/WorkoutContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import ExerciseSelector from '@/components/ExerciseSelector';
import type { Exercise as ExerciseSelectorType } from '@/components/ExerciseSelector';
import { STORAGE_KEYS } from '@/core/constants/AppConstants';
import { storageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';

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
  const { preferences } = usePreferences();
  const { activeWorkout, startWorkout, updateWorkout, endWorkout } = useWorkout();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  
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
  const [summaryMessage, setSummaryMessage] = useState<string>('');
  const [workoutNumber, setWorkoutNumber] = useState(1);
  const [workoutName, setWorkoutName] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Load active workout from context or start new one
  useEffect(() => {
    const initializeWorkout = async () => {
      setIsInitializing(true);
      
      if (activeWorkout) {
        // Resume existing workout
        setExercises(activeWorkout.exercises);
        // Calculate elapsed time from start time instead of using stored value
        const now = Date.now();
        const calculatedTime = Math.floor((now - activeWorkout.startTime) / 1000);
        setElapsedSeconds(calculatedTime);
        setIsPaused(activeWorkout.isPaused);
        setWorkoutNumber(activeWorkout.workoutNumber);
        setWorkoutName(activeWorkout.workoutName);
        setIsInitializing(false);
      } else {
        // Start new workout
        const template = location.state?.template;
        let initialExercises: Exercise[] = [];
        
        try {
          // Check if there's an active workout in the backend
          const backendWorkout = await liveWorkoutService.getActiveWorkout();
          
          // If we're coming with a fresh template, cancel any existing workout and start fresh
          if (template && backendWorkout) {
            console.log('Cancelling existing workout to start from template');
            await liveWorkoutService.cancelWorkout();
          }
          
          if (backendWorkout && !template) {
            // Resume from backend (only if not starting from template)
            // Convert backend exercises to frontend format
            const resumedExercises: Exercise[] = backendWorkout.exercises.map((ex) => ({
              id: String(ex.id), // Convert to string for frontend
              name: ex.name,
              sets: ex.sets.map((s: any) => ({
                reps: s.reps || '',
                weight: s.weight || '',
                rpe: s.rpe,
                completed: s.completed || false,
                isWarmup: s.is_warmup || false,
                isDropset: s.is_dropset || false,
                isFailure: s.is_failure || false,
              }))
            }));
            
            setExercises(resumedExercises);
            // Calculate elapsed time from backend startTime instead of using stored value
            const now = Date.now();
            const backendStartTime = backendWorkout.startTime ? new Date(backendWorkout.startTime).getTime() : Date.now();
            const calculatedTime = Math.floor((now - backendStartTime) / 1000);
            setElapsedSeconds(calculatedTime);
            setIsPaused(backendWorkout.isPaused || false);
            setWorkoutNumber(backendWorkout.workoutNumber);
            setWorkoutName(backendWorkout.workoutName || '');
            
            // Update context
            startWorkout(resumedExercises);
          } else {
            // No backend workout, or starting from template - start fresh
            console.log('Starting workout with template:', template);
            
            // Create workout in backend
            const newWorkout = await liveWorkoutService.startWorkout({
              workout_name: template?.name || '', // Use template name if starting from template
              template_id: null
            });
            
            // If starting from a template, add exercises to backend (in parallel for speed)
            if (template && template.exercises && template.exercises.length > 0) {
              console.log('Adding template exercises:', template.exercises);
              // Add all exercises in parallel to eliminate loading delay
              const exercisePromises = template.exercises.map((exerciseName: string) => 
                liveWorkoutService.addExercise(newWorkout.id, {
                  exercise_name: exerciseName,
                  notes: null
                })
              );
              
              const exerciseResponses = await Promise.all(exercisePromises);
              console.log('Exercise responses:', exerciseResponses);
              
              // Create frontend exercises with backend IDs
              initialExercises = exerciseResponses.map((exerciseResponse) => ({
                id: String(exerciseResponse.id),
                name: exerciseResponse.name,
                sets: [{ reps: '', weight: '', completed: false }],
              }));
            }
            
            setExercises(initialExercises);
            setWorkoutNumber(newWorkout.workoutNumber);
            setWorkoutName(newWorkout.workoutName || '');
            
            // Update context
            startWorkout(initialExercises);
          }
        } catch (error) {
          console.error('Failed to initialize workout:', error);
          toast({
            title: "Error",
            description: "Failed to start workout. Please try again.",
            variant: "destructive"
          });
          navigate('/dashboard');
        } finally {
          setIsInitializing(false);
        }
      }
    };
    
    initializeWorkout();
  }, []);

  // Save workout state to context whenever it changes
  useEffect(() => {
    if (activeWorkout && exercises.length > 0) {
      updateWorkout({
        exercises,
        elapsedSeconds: 0, // Don't store elapsed time - always calculate from startTime
        isPaused,
        workoutNumber,
        workoutName,
        startTime: activeWorkout.startTime,
      });
    }
  }, [exercises, isPaused, workoutNumber, workoutName]);

  const popularExercises = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
    'Pull-ups', 'Rows', 'Bicep Curls', 'Tricep Extensions'
  ];

  // Full exercise library for selection
  const allExercises: ExerciseSelectorType[] = [
    // Chest
    { id: '1', name: 'Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate' },
    { id: '2', name: 'Incline Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate' },
    { id: '3', name: 'Flat Dumbbell Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    { id: '4', name: 'Incline Dumbbell Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    { id: '5', name: 'Decline Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate' },
    { id: '6', name: 'Chest Dips', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Advanced' },
    { id: '7', name: 'Cable Fly', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    { id: '8', name: 'Incline Cable Fly', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    { id: '9', name: 'Pec Deck Machine', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    { id: '10', name: 'Push-Ups', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner' },
    
    // Back
    { id: '11', name: 'Deadlift', category: 'Strength', muscleGroup: 'Back', difficulty: 'Advanced' },
    { id: '12', name: 'Pull-Ups', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate' },
    { id: '13', name: 'Chin-Ups', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Intermediate' },
    { id: '14', name: 'Lat Pulldown', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner' },
    { id: '15', name: 'Barbell Bent-Over Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate' },
    { id: '16', name: 'T-Bar Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate' },
    { id: '17', name: 'Seated Cable Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner' },
    { id: '18', name: 'Single-Arm Dumbbell Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner' },
    
    // Legs
    { id: '21', name: 'Barbell Back Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate' },
    { id: '22', name: 'Barbell Front Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Advanced' },
    { id: '23', name: 'Leg Press', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner' },
    { id: '24', name: 'Romanian Deadlift', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate' },
    { id: '25', name: 'Bulgarian Split Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate' },
    { id: '26', name: 'Walking Lunges', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner' },
    { id: '27', name: 'Leg Extensions', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner' },
    { id: '28', name: 'Hamstring Curls', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner' },
    { id: '29', name: 'Hip Thrusts', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate' },
    { id: '30', name: 'Calf Raises', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner' },
    
    // Shoulders
    { id: '33', name: 'Overhead Barbell Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Intermediate' },
    { id: '34', name: 'Dumbbell Shoulder Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
    { id: '35', name: 'Arnold Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Intermediate' },
    { id: '36', name: 'Lateral Raises', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
    { id: '37', name: 'Front Raises', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
    { id: '38', name: 'Rear Delt Fly', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
    
    // Arms
    { id: '41', name: 'Barbell Bicep Curl', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner' },
    { id: '42', name: 'Hammer Curls', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner' },
    { id: '43', name: 'Preacher Curls', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner' },
    { id: '44', name: 'Tricep Dips', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Intermediate' },
    { id: '45', name: 'Tricep Pushdowns', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner' },
    { id: '46', name: 'Overhead Tricep Extension', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner' },
    { id: '47', name: 'Skull Crushers', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Intermediate' },
    
    // Core
    { id: '51', name: 'Plank', category: 'Strength', muscleGroup: 'Core', difficulty: 'Beginner' },
    { id: '52', name: 'Russian Twists', category: 'Strength', muscleGroup: 'Core', difficulty: 'Beginner' },
    { id: '53', name: 'Bicycle Crunches', category: 'Strength', muscleGroup: 'Core', difficulty: 'Beginner' },
    { id: '54', name: 'Hanging Leg Raises', category: 'Strength', muscleGroup: 'Core', difficulty: 'Advanced' },
    { id: '55', name: 'Ab Wheel Rollout', category: 'Strength', muscleGroup: 'Core', difficulty: 'Intermediate' },
    
    // Cardio
    { id: '61', name: 'Running', category: 'Cardio', muscleGroup: 'Full Body', difficulty: 'Beginner' },
    { id: '62', name: 'Cycling', category: 'Cardio', muscleGroup: 'Legs', difficulty: 'Beginner' },
    { id: '63', name: 'Rowing', category: 'Cardio', muscleGroup: 'Full Body', difficulty: 'Intermediate' },
    { id: '64', name: 'Jump Rope', category: 'Cardio', muscleGroup: 'Full Body', difficulty: 'Beginner' },
    { id: '65', name: 'Burpees', category: 'Cardio', muscleGroup: 'Full Body', difficulty: 'Intermediate' },
  ];

  const motivationalMessages = [
    "You smashed it today!",
    "Consistency is power!",
    "Great work — every rep counts!",
    "Another step closer to your goals!",
    "Strength built, one workout at a time!",
    "You showed up and crushed it!"
  ];

  // Timer effect - calculate display time from startTime only
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused && !showSummary && activeWorkout) {
      interval = setInterval(() => {
        const now = Date.now();
        // Calculate time purely from startTime (don't add elapsedSeconds - that causes double counting)
        const calculatedTime = Math.floor((now - activeWorkout.startTime) / 1000);
        setElapsedSeconds(calculatedTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, showSummary, activeWorkout]);

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



  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addExercise = async (name: string) => {
    try {
      // Get active workout to add exercise to backend
      const activeWorkoutResponse = await liveWorkoutService.getActiveWorkout();
      
      if (activeWorkoutResponse) {
        // Add exercise to backend
        const exerciseResponse = await liveWorkoutService.addExercise(activeWorkoutResponse.id, {
          exercise_name: name,
          notes: null
        });
        
        // Add to frontend with backend ID
        const newExercise: Exercise = {
          id: String(exerciseResponse.id),
          name: exerciseResponse.name,
          sets: [{ reps: '', weight: '', completed: false }]
        };
        setExercises([...exercises, newExercise]);
      } else {
        // Fallback: add locally if no backend workout (shouldn't happen)
        const newExercise: Exercise = {
          id: Date.now().toString(),
          name,
          sets: [{ reps: '', weight: '', completed: false }]
        };
        setExercises([...exercises, newExercise]);
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingExercise(false);
    }
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

    // Validate reps and weight are numbers
    const reps = parseInt(set.reps);
    const weight = parseFloat(set.weight);
    
    if (isNaN(reps) || isNaN(weight) || reps <= 0 || weight < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for reps and weight.",
        variant: "destructive"
      });
      return;
    }

    // Mark set as completed with validated values
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? {
            ...ex,
            sets: ex.sets.map((s, idx) => 
              idx === setIndex ? { 
                ...s, 
                completed: true,
                reps: reps.toString(),
                weight: weight.toString()
              } : s
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

  const finishWorkout = async () => {
    const totalVolume = calculateTotalWeight();
    const finalName = workoutName || `Workout – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    try {
      // Get the active workout (should exist since we created it on start)
      const activeWorkoutResponse = await liveWorkoutService.getActiveWorkout();
      
      if (!activeWorkoutResponse) {
        throw new Error('No active workout found');
      }
      
      const workoutId = activeWorkoutResponse.id;
      
      // Map frontend exercise IDs to backend exercise IDs
      const exerciseIdMap = new Map<string, number>();
      for (const backendEx of activeWorkoutResponse.exercises) {
        exerciseIdMap.set(String(backendEx.id), Number(backendEx.id));
      }
      
      // Add completed sets to existing exercises in backend BEFORE finishing
      // Only process exercises that have at least one completed set
      for (const exercise of exercises) {
        // Check if this exercise has any completed sets
        const hasCompletedSets = exercise.sets.some(set => set.completed);
        if (!hasCompletedSets) {
          // Skip exercises with no completed sets
          continue;
        }
        
        let backendExerciseId = exerciseIdMap.get(exercise.id);
        
        // If exercise doesn't exist in backend (manually added during workout), create it
        if (!backendExerciseId) {
          const exerciseResponse = await liveWorkoutService.addExercise(workoutId, {
            exercise_name: exercise.name,
            notes: null
          });
          backendExerciseId = exerciseResponse.id;
        }
        
        // Add all completed sets for this exercise
        for (const set of exercise.sets) {
          if (set.completed) {
            await liveWorkoutService.addSet(backendExerciseId, {
              reps: set.reps || '0',
              weight: set.weight || '0',
              rpe: set.rpe || null,
              completed: true, // CRITICAL: Mark as completed for backend analytics
              is_warmup: set.isWarmup || false,
              is_dropset: set.isDropset || false,
              is_failure: set.isFailure || false
            });
          }
        }
      }
      
      // NOW finish the workout in backend (after all sets are added)
      // Backend will calculate total_volume, total_sets, etc.
      await liveWorkoutService.finishWorkout({ workout_name: finalName });
      
      // Save workout count
      storageAdapter.set(STORAGE_KEYS.WORKOUT_COUNT, workoutNumber);
      
      // Update streak
      updateStreakOnWorkout();
      
      // Save the workout to history locally (for backward compatibility)
      // Only include exercises with at least one completed set
      const completedExercises = exercises.filter(ex => 
        ex.sets.some(set => set.completed)
      );
      
      saveWorkout({
        name: finalName,
        date: formatWorkoutDate(Date.now()),
        exercises: completedExercises.map(ex => ({
          name: ex.name,
          sets: ex.sets
        })),
        duration: elapsedSeconds,
        totalVolume: totalVolume
      });
      
      // Invalidate workout cache so fresh data is fetched
      invalidateWorkoutCache();
      
      // Clear active workout from context
      endWorkout();
      
      // Select motivational message once (prevent flickering)
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setSummaryMessage(randomMessage);
      
      // Show summary
      setShowSummary(true);
      
      toast({
        title: randomMessage,
        description: "Your workout has been saved.",
      });
    } catch (error) {
      console.error('Failed to save workout to backend:', error);
      toast({
        title: "Workout Save Error",
        description: "Failed to save workout to server. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  };

  const closeSummary = () => {
    navigate('/dashboard', { state: { refreshData: true } });
  };

  const cancelWorkout = () => {
    if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      endWorkout();
      toast({
        title: "Workout Cancelled",
        description: "Your workout has been cancelled without saving.",
      });
      navigate('/dashboard');
    }
  };

  if (showSummary) {
    const totalWeight = calculateTotalWeight();
    // Only count exercises and sets that were actually completed
    const completedExercises = exercises.filter(ex => ex.sets.some(set => set.completed));
    const completedSetsCount = exercises.reduce((total, ex) => 
      total + ex.sets.filter(set => set.completed).length, 0
    );

    return (
      <Layout>
        <div className="w-full min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto p-4">
          <Card className="w-full max-w-md animate-fade-in card-elevated">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">{summaryMessage}</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Total {preferences.weightUnit} lifted</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{completedExercises.length}</p>
                    <p className="text-sm text-muted-foreground">Exercises</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {completedSetsCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed Sets</p>
                  </div>
                </div>
              </div>

              <Button onClick={closeSummary} className="w-full" size="lg">
                <X className="h-5 w-5 mr-2" />
                Close
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Layout>
        <div className="w-full min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Preparing your workout...</p>
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
                        <span className="text-sm text-muted-foreground">{preferences.weightUnit}</span>
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
        <Drawer open={isAddingExercise} onOpenChange={setIsAddingExercise}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Add Exercise</DrawerTitle>
            </DrawerHeader>
            <div className="px-6 pb-6 overflow-y-auto">
              <ExerciseSelector
                exercises={allExercises}
                selectedExercises={[]}
                onSelect={addExercise}
                multiSelect={false}
                showSelectedCount={false}
              />
            </div>
            <DrawerFooter className="border-t">
              <Button
                variant="outline"
                onClick={() => setIsAddingExercise(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {!isAddingExercise && (
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
          <div className="flex gap-3">
            <Button onClick={cancelWorkout} variant="outline" className="flex-1" size="lg">
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button onClick={finishWorkout} className="flex-1" size="lg">
              <Check className="h-5 w-5 mr-2" />
              Finish Workout
            </Button>
          </div>
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
