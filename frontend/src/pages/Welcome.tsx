import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, TrendingUp, Target, BarChart3, Clock, Trophy, Zap, Award, Users } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show animation
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = (isSignUp: boolean) => {
    navigate('/login', { state: { isSignUp } });
  };

  const features = [
    { 
      icon: Target, 
      title: 'Custom Templates', 
      description: 'Create personalized workout routines tailored to your goals',
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      icon: Activity, 
      title: 'Live Tracking', 
      description: 'Log your reps, sets, and weights in real-time during workouts',
      color: 'from-green-500 to-emerald-500' 
    },
    { 
      icon: BarChart3, 
      title: 'Analytics Dashboard', 
      description: 'Visualize your progress with detailed charts and statistics',
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      icon: TrendingUp, 
      title: 'Progress Tracking', 
      description: 'Monitor your strength gains and personal records over time',
      color: 'from-orange-500 to-red-500' 
    },
    { 
      icon: Trophy, 
      title: 'Goal Setting', 
      description: 'Set and achieve fitness milestones with our goal system',
      color: 'from-yellow-500 to-orange-500' 
    },
    { 
      icon: Zap, 
      title: 'Quick Workouts', 
      description: 'Start empty sessions or load from templates instantly',
      color: 'from-indigo-500 to-purple-500' 
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '500K+', label: 'Workouts Logged' },
    { number: '50M+', label: 'Reps Tracked' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEwMCwxMDAsMTAwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-accent/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className={`relative z-10 transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section - Split Layout */}
        <div className="container mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8">
              {/* Logo & Brand */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                  <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                    <Activity className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-pink-600">
                    RepTrack
                  </h1>
                  <p className="text-sm text-muted-foreground">Fitness Tracking Platform</p>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  Track Every Rep,
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-pink-600">
                    Master Every Goal
                  </span>
                </h2>
                <p className="text-lg lg:text-xl text-foreground leading-relaxed max-w-xl">
                  The ultimate workout tracking platform for serious athletes. Build custom templates, 
                  track live sessions, and analyze your performance with powerful analytics.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => handleGetStarted(true)}
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => handleGetStarted(false)}
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg border-2 hover:bg-primary/5"
                >
                  Log In
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                      {stat.number}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className={`p-6 hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <feature.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof Bar */}
        <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 lg:px-12 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Users className="h-5 w-5" />
                <p className="text-sm">Trusted by athletes worldwide</p>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Award className="h-5 w-5" />
                <p className="text-sm">Track. Analyze. Improve.</p>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Trophy className="h-5 w-5" />
                <p className="text-sm">Achieve your fitness goals</p>
              </div>
            </div>
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
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
