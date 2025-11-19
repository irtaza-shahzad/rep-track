import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('fittrack_visited');
    if (hasVisited) {
      navigate('/login');
      return;
    }

    // Show animation, then buttons
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGetStarted = (isSignUp: boolean) => {
    localStorage.setItem('fittrack_visited', 'true');
    navigate('/login', { state: { isSignUp } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center">
        {/* Logo Animation */}
        <div className={`mb-8 transition-all duration-1000 ${showButtons ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
          <div className="mx-auto h-24 w-24 rounded-2xl bg-primary flex items-center justify-center sage-glow animate-scale-in">
            <Dumbbell className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <div className={`mb-4 transition-all duration-1000 delay-300 ${showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            FitTrack
          </h1>
          <p className="text-muted-foreground text-lg">
            Your fitness journey starts here
          </p>
        </div>

        {/* Buttons */}
        {showButtons && (
          <Card className={`p-6 max-w-sm mx-auto card-elevated animate-fade-in`}>
            <div className="space-y-3">
              <Button 
                onClick={() => handleGetStarted(true)}
                className="w-full"
                size="lg"
              >
                Sign Up
              </Button>
              <Button 
                onClick={() => handleGetStarted(false)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Log In
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Welcome;
