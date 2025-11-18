import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Library, TrendingUp, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Library, label: 'Exercises', path: '/exercises' },
    { icon: TrendingUp, label: 'Stats', path: '/stats' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <main className="flex-1 animate-fade-in">
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
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col p-4 card-elevated">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">FitTrack</h1>
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
