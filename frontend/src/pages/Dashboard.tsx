import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { StartWorkoutDialog } from '@/components/StartWorkoutDialog';
import { TemplatePickerDialog } from '@/components/TemplatePickerDialog';

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: string[];
  duration: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const isWorkoutActive = location.state?.workoutActive || false;

  useEffect(() => {
    // Load templates from localStorage
    const stored = localStorage.getItem('workout_templates');
    if (stored) {
      try {
        setTemplates(JSON.parse(stored));
      } catch {
        setTemplates([]);
      }
    }
  }, []);

  const stats = [
    { label: 'Workouts This Week', value: '4', icon: Target, color: 'text-primary' },
    { label: 'Current Streak', value: '7 days', icon: Flame, color: 'text-accent' },
    { label: 'Total Volume', value: '12.5K lbs', icon: TrendingUp, color: 'text-chart-gold' },
  ];

  const recentWorkouts = [
    { name: 'Upper Body', date: 'Today', exercises: 8, duration: '45 min' },
    { name: 'Leg Day', date: 'Yesterday', exercises: 6, duration: '52 min' },
    { name: 'Core & Cardio', date: '2 days ago', exercises: 5, duration: '30 min' },
  ];

  const handleStartWorkout = () => {
    setShowStartDialog(true);
  };

  const handleStartEmpty = () => {
    setShowStartDialog(false);
    navigate('/workout', { state: { template: null } });
  };

  const handleStartFromTemplate = () => {
    setShowStartDialog(false);
    setShowTemplatePicker(true);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setShowTemplatePicker(false);
    navigate('/workout', { state: { template } });
  };

  // Don't show dashboard if workout is active
  if (isWorkoutActive) {
    return null;
  }

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Ready to crush your goals?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="card-elevated">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-6 animate-slide-up">
          <Button 
            size="lg" 
            className="w-full md:w-auto"
            onClick={handleStartWorkout}
          >
            <Plus className="mr-2 h-5 w-5" />
            Start New Workout
          </Button>
        </div>

        {/* Recent Workouts */}
        <Card className="card-elevated animate-slide-up">
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentWorkouts.map((workout, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate('/history')}
                >
                  <div>
                    <h3 className="font-semibold mb-1">{workout.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {workout.exercises} exercises • {workout.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{workout.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Start Workout Dialog */}
        <StartWorkoutDialog
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          onStartEmpty={handleStartEmpty}
          onStartFromTemplate={handleStartFromTemplate}
        />

        {/* Template Picker Dialog */}
        <TemplatePickerDialog
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
