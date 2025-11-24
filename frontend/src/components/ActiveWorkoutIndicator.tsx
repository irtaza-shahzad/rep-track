import { Clock, Dumbbell, X } from 'lucide-react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const ActiveWorkoutIndicator = () => {
  const { activeWorkout, endWorkout } = useWorkout();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [displayTime, setDisplayTime] = useState(0);

  // Don't show on workout page or welcome/login pages
  const shouldShow = activeWorkout && 
    location.pathname !== '/workout' && 
    location.pathname !== '/' && 
    location.pathname !== '/login';

  // Update display time based on elapsed seconds + time since start
  useEffect(() => {
    if (!activeWorkout || !shouldShow) return;

    const updateTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - activeWorkout.startTime) / 1000);
      setDisplayTime(activeWorkout.elapsedSeconds + elapsed);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, shouldShow]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!shouldShow) return null;

  const exerciseCount = activeWorkout.exercises.length;
  const completedSets = activeWorkout.exercises.reduce(
    (total, ex) => total + ex.sets.filter(s => s.completed).length,
    0
  );

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      endWorkout();
      toast({
        title: "Workout Cancelled",
        description: "Your workout has been cancelled without saving.",
      });
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-slide-down">
      <Card 
        className="cursor-pointer hover:scale-[1.02] transition-transform shadow-lg border-2 border-primary/30 bg-primary/5 backdrop-blur-sm"
        onClick={() => navigate('/workout')}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Active Workout</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{formatTime(displayTime)}</span>
                <span>•</span>
                <span>{exerciseCount} exercises</span>
                <span>•</span>
                <span>{completedSets} sets</span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10"
              title="Cancel workout"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveWorkoutIndicator;
