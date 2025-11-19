import { User, Bell, Download, LogOut, HelpCircle, Mail } from 'lucide-react';
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

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [workoutReminders, setWorkoutReminders] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('fittrack_user');
    navigate('/');
  };

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-4xl">
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
                <p className="font-medium mt-1">user@example.com</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Notifications
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-accent" />
                </div>
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setWorkoutReminders(!workoutReminders)}
              >
                <div className="flex-1">
                  <Label htmlFor="workout-reminders" className="cursor-pointer font-medium">
                    Workout Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified about scheduled workouts
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Delivered via email
                  </p>
                </div>
                <Switch 
                  id="workout-reminders" 
                  checked={workoutReminders}
                  onCheckedChange={setWorkoutReminders}
                  className="ml-4"
                />
              </div>

              <Separator />

              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setProgressUpdates(!progressUpdates)}
              >
                <div className="flex-1">
                  <Label htmlFor="progress-updates" className="cursor-pointer font-medium">
                    Progress Updates
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Weekly summary of your progress
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Delivered via email
                  </p>
                </div>
                <Switch 
                  id="progress-updates" 
                  checked={progressUpdates}
                  onCheckedChange={setProgressUpdates}
                  className="ml-4"
                />
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

        {/* Support Section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Support
          </h2>
          <Card className="card-elevated animate-slide-up hover-scale transition-all duration-200">
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-xl h-auto py-4 px-6 hover:bg-muted/30"
                onClick={() => toast({ title: "Help Center", description: "Opening help documentation..." })}
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mr-3">
                  <HelpCircle className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Help Center</p>
                  <p className="text-xs text-muted-foreground">Browse FAQs and guides</p>
                </div>
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start rounded-xl h-auto py-4 px-6 hover:bg-muted/30"
                onClick={() => toast({ title: "Contact Support", description: "Opening email client..." })}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">Contact Support</p>
                  <p className="text-xs text-muted-foreground">Get help from our team</p>
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
      </div>
    </Layout>
  );
};

export default Settings;
