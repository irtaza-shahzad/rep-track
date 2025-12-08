import { User, Bell, Download, LogOut, HelpCircle, Mail, Palette, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useWorkout } from '@/contexts/WorkoutContext';
import { authService } from '@/services/authService';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const { preferences, updateWeightUnit, updateTimeFormat } = usePreferences();
  const { endWorkout } = useWorkout();
  
  // Get current user info
  const currentUser = authService.getCurrentUser();

  const handleLogout = () => {
    // Clear workout context before logout
    endWorkout();
    
    // Clear all user data (auth, drafts, cache, preferences)
    authService.logout();
    
    // Navigate to login
    navigate('/');
  };

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        {/* Account Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Account
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium mt-1">{currentUser?.email || 'Not logged in'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reminders Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Reminders
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-xl h-auto py-4 px-6 hover:bg-muted/30"
                onClick={() => navigate('/reminders')}
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mr-3">
                  <Bell className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Workout Reminders</p>
                  <p className="text-xs text-muted-foreground">Set up notifications to stay on track</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Preferences
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                Display & Units
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => {
                  const newUnit = preferences.weightUnit === 'lbs' ? 'kg' : 'lbs';
                  updateWeightUnit(newUnit);
                  toast({ title: 'Unit Updated', description: `Weight unit changed to ${newUnit}` });
                }}
              >
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium">Weight Unit</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {preferences.weightUnit === 'lbs' ? 'Pounds (lbs)' : 'Kilograms (kg)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{preferences.weightUnit}</span>
                  <Switch 
                    checked={preferences.weightUnit === 'kg'}
                    onCheckedChange={(checked) => {
                      const newUnit = checked ? 'kg' : 'lbs';
                      updateWeightUnit(newUnit);
                      toast({ title: 'Unit Updated', description: `Weight unit changed to ${newUnit}` });
                    }}
                  />
                </div>
              </div>
              
              <Separator />

              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => {
                  const newFormat = preferences.timeFormat === '12h' ? '24h' : '12h';
                  updateTimeFormat(newFormat);
                  toast({ title: 'Format Updated', description: `Time format changed to ${newFormat === '12h' ? '12-hour' : '24-hour'}` });
                }}
              >
                <div className="flex-1">
                  <Label className="cursor-pointer font-medium">Time Format</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {preferences.timeFormat === '12h' ? '12-hour clock (AM/PM)' : '24-hour clock'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{preferences.timeFormat}</span>
                  <Switch 
                    checked={preferences.timeFormat === '24h'}
                    onCheckedChange={(checked) => {
                      const newFormat = checked ? '24h' : '12h';
                      updateTimeFormat(newFormat);
                      toast({ title: 'Format Updated', description: `Time format changed to ${newFormat === '12h' ? '12-hour' : '24-hour'}` });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data & Privacy Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Data & Privacy
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start rounded-xl h-auto py-3"
                onClick={() => toast({ title: "Export Started", description: "Your workout data is being prepared for download." })}
              >
                <Download className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Export Workout Data</p>
                  <p className="text-xs text-muted-foreground">Download your complete history</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* About & Help Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            About
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-xl h-auto py-4 px-6 hover:bg-muted/30"
                onClick={() => setShowHelpDialog(true)}
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mr-3">
                  <HelpCircle className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">How to Use</p>
                  <p className="text-xs text-muted-foreground">Quick start guide and tips</p>
                </div>
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-xl h-auto py-4 px-6 hover:bg-muted/30"
                onClick={() => setShowAboutDialog(true)}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">About This App</p>
                  <p className="text-xs text-muted-foreground">Version and app info</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Card className="card-elevated animate-slide-up mb-6">
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full rounded-xl h-12 active:scale-[0.98] transition-transform"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to log in again to access your data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Help Dialog */}
        <AlertDialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <AlertDialogContent className="rounded-2xl max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-accent" />
                How to Use Rep-Track
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-3 pt-2">
                <div>
                  <p className="font-semibold text-foreground mb-1">Dashboard</p>
                  <p className="text-sm">View your workout statistics and progress at a glance.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Workout Logging</p>
                  <p className="text-sm">Start a workout, select exercises, and log your sets with weights and reps.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Stats & History</p>
                  <p className="text-sm">Track your personal records and view detailed workout history.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Reminders</p>
                  <p className="text-sm">Set scheduled reminders to stay consistent with your training.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Settings</p>
                  <p className="text-sm">Customize weight units (lbs/kg) and time format (12h/24h).</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="rounded-xl">Got it!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* About Dialog */}
        <AlertDialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
          <AlertDialogContent className="rounded-2xl max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                About Rep-Track
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-3 pt-2">
                <div>
                  <p className="font-semibold text-foreground mb-1">Version</p>
                  <p className="text-sm">1.0.0</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Created By</p>
                  <p className="text-sm">Irtaza, Taha & Abdullah</p>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground italic">Made with love in Pakistan</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="rounded-xl">Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
