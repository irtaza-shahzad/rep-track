import { Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyStreak, type Streak } from '@/services/streakService';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

const StreakIndicator = () => {
  const [streak, setStreak] = useState<Streak | null | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadStreak();
  }, [location.pathname]); // Reload when navigating

  const loadStreak = async () => {
    try {
      const data = await getMyStreak();
      setStreak(data);
    } catch (error) {
      logger.error('Failed to load streak', error);
      setStreak(null);
    }
  };

  const handleClick = () => {
    navigate('/reminders'); // Navigate to streaks/reminders page
  };

  // Loading state - show skeleton
  if (streak === undefined) {
    return (
      <Card className="card-elevated hover:scale-105 transition-transform">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted flex items-center justify-center animate-pulse">
              <Flame className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold mb-0.5">--</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-tight">Current Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="card-elevated hover:scale-105 transition-transform cursor-pointer" 
      onClick={handleClick}
      title={streak ? `Current streak: ${streak.current_streak} weeks` : 'Start your workout streak'}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center ${
            streak && streak.current_streak > 0 
              ? 'bg-accent/20 text-accent' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Flame className={`h-5 w-5 md:h-6 md:w-6 ${
              streak && streak.current_streak > 0 ? 'animate-pulse' : ''
            }`} />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold mb-0.5">
              {streak ? streak.current_streak : '0'}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground leading-tight">
              {streak ? (
                <span>
                  {streak.workouts_this_week}/{streak.target_days_per_week} week
                </span>
              ) : (
                'Not Started'
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakIndicator;
