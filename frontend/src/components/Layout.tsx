import { ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Library, TrendingUp, Settings, Flame, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getMyStreak, type Streak } from '@/services/streakService';
import { logger } from '@/lib/logger';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    loadStreak();
  }, [location.pathname]);

  const loadStreak = async () => {
    try {
      const data = await getMyStreak();
      setStreak(data);
    } catch (error) {
      logger.error('Failed to load streak', error);
      setStreak(null);
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Library, label: 'Exercises', path: '/exercises' },
    { icon: TrendingUp, label: 'Stats', path: '/stats' },
    { icon: Bell, label: 'Reminders', path: '/reminders' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      {/* Universal Header - Mobile Only */}
      <header className="md:hidden bg-muted/30 border-b border-border/30 sticky top-0 z-40 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-base font-bold text-foreground">FitTrack</h1>
          {streak && (
            <button
              onClick={() => navigate('/stats')}
              title={`Current Streak: ${streak.current_streak} days`}
              className="flex items-center gap-1 bg-accent/10 border border-accent/20 rounded-full px-2 py-1 hover:bg-accent/20 transition-colors"
            >
              <Flame className="h-4 w-4 text-accent" />
              <span className="font-semibold text-sm">{streak.current_streak}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 animate-fade-in md:ml-64">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden card-elevated z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center touch-target transition-colors duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${active ? 'sage-glow' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Navigation - Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col p-4 card-elevated z-30">
        <div className="mb-8 pt-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-primary">FitTrack</h1>
              {streak && (
                <button
                onClick={() => navigate('/stats')}
                title={`Current Streak: ${streak.current_streak} days`}
                className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-2.5 py-1 hover:bg-accent/20 transition-colors ml-2"
              >
                <Flame className="h-4 w-4 text-accent" />
                <span className="font-semibold text-sm">{streak.current_streak}</span>
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Your Workout Companion</p>
        </div>
        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active 
                    ? 'bg-primary text-primary-foreground sage-glow' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
