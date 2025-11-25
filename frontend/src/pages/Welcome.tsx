import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, TrendingUp, Target, BarChart3, Dumbbell } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show animation
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = (isSignUp: boolean) => {
    navigate('/login', { state: { isSignUp } });
  };

  const features = [
    { 
      icon: Target, 
      title: 'Custom Templates', 
      description: 'Build personalized routines'
    },
    { 
      icon: Activity, 
      title: 'Live Tracking', 
      description: 'Log reps & sets in real-time'
    },
    { 
      icon: BarChart3, 
      title: 'Analytics', 
      description: 'Visualize your progress'
    },
    { 
      icon: TrendingUp, 
      title: 'Progress Tracking', 
      description: 'Monitor your strength gains'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className={`relative z-10 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-0 lg:min-h-screen lg:flex lg:items-center">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center w-full">
            
            {/* Left Side - Content */}
            <div className="space-y-6 sm:space-y-8 lg:space-y-10 text-center lg:text-left">
              {/* Logo & Brand */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-3 lg:space-y-0 lg:space-x-4 animate-scale-in">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl sage-glow">
                    <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient">
                    FitTrack
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">Your Workout Companion</p>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-3 sm:space-y-4 animate-fade-in-up animation-delay-200">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                  Track Every Rep.
                  <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Master Every Goal.
                  </span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  A comprehensive workout tracking platform designed to help you achieve your fitness goals. 
                  Create custom workout templates, log exercises in real-time, and analyze your progress with 
                  detailed performance metrics. Everything you need to stay consistent and reach new personal records.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row gap-3 justify-center lg:justify-start items-center animate-fade-in-up animation-delay-400">
                <Button 
                  onClick={() => handleGetStarted(true)}
                  size="lg"
                  className="h-11 px-6 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 sage-glow"
                >
                  Sign Up
                </Button>
                <Button 
                  onClick={() => handleGetStarted(false)}
                  variant="outline"
                  size="lg"
                  className="h-11 px-6 text-base border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 lg:mt-0 animate-fade-in-up animation-delay-600">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-3 sm:p-4 hover:scale-105 transition-all duration-300 cursor-pointer border border-border hover:border-primary/50 hover:shadow-xl group bg-card/50 backdrop-blur-sm"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:sage-glow">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold mb-0.5 text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Minimal Footer Tagline - Only on Mobile */}
        <div className="lg:hidden pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            Track. Analyze. Improve.
          </p>
        </div>

        {/* Fancy Bottom Text - Desktop Only */}
        <div className="hidden lg:block fixed bottom-8 left-0 right-0 z-20">
          <div className="text-center space-y-2 animate-fade-in-up animation-delay-1000">
            <p className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              Performance Analytics • Custom Workflows • Progress Visualization
            </p>
            <p className="text-xs text-muted-foreground">
              Professional fitness tracking for serious athletes
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
