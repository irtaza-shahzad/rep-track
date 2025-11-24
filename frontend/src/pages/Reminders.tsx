import { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Calendar, Edit2, Trash2, AlertCircle, CalendarClock, Target, BarChart3, AlertTriangle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: number;
  user_id: number;
  reminder_type: 'Scheduled' | 'DailyGoal' | 'WeeklyTarget' | 'StreakRisk' | 'Milestone';
  title: string;
  description: string | null;
  scheduled_time: string | null;
  days_of_week: number[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Reminders = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    reminder_type: 'Scheduled' as Reminder['reminder_type'],
    title: '',
    description: '',
    scheduled_time: '',
    days_of_week: [] as number[],
    is_active: true,
  });

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const reminderTypes = [
    { value: 'Scheduled', label: 'Scheduled', icon: CalendarClock, description: 'Custom time and days' },
    { value: 'DailyGoal', label: 'Daily Goal', icon: Target, description: 'If no workout logged today' },
    { value: 'WeeklyTarget', label: 'Weekly Target', icon: BarChart3, description: 'Check weekly progress' },
    { value: 'StreakRisk', label: 'Streak Risk', icon: AlertTriangle, description: 'Maintain your streak' },
    { value: 'Milestone', label: 'Milestone', icon: Trophy, description: 'Celebration alerts' },
  ];

  // Mock data - Replace with API calls
  useEffect(() => {
    // TODO: Fetch reminders from backend
    // GET /reminders
    const mockReminders: Reminder[] = [
      {
        id: 1,
        user_id: 1,
        reminder_type: 'Scheduled',
        title: 'Evening Workout',
        description: 'Time to hit the gym!',
        scheduled_time: '18:30',
        days_of_week: [1, 3, 5],
        is_active: true,
        created_at: '2025-11-21T10:00:00Z',
        updated_at: '2025-11-21T10:00:00Z',
      },
      {
        id: 2,
        user_id: 1,
        reminder_type: 'DailyGoal',
        title: "Don't forget to log your workout",
        description: null,
        scheduled_time: null,
        days_of_week: null,
        is_active: true,
        created_at: '2025-11-21T11:00:00Z',
        updated_at: '2025-11-21T11:00:00Z',
      },
    ];
    setReminders(mockReminders);
  }, []);

  const handleCreateReminder = () => {
    resetForm();
    setIsEditing(false);
    setShowCreateDialog(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setFormData({
      reminder_type: reminder.reminder_type,
      title: reminder.title,
      description: reminder.description || '',
      scheduled_time: reminder.scheduled_time || '',
      days_of_week: reminder.days_of_week || [],
      is_active: reminder.is_active,
    });
    setIsEditing(true);
    setShowCreateDialog(true);
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowDeleteDialog(true);
  };

  const handleSaveReminder = () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    if (formData.reminder_type === 'Scheduled') {
      if (!formData.scheduled_time) {
        toast({ title: 'Error', description: 'Time is required for scheduled reminders', variant: 'destructive' });
        return;
      }
      if (formData.days_of_week.length === 0) {
        toast({ title: 'Error', description: 'Select at least one day', variant: 'destructive' });
        return;
      }
    }

    // TODO: API call
    if (isEditing && selectedReminder) {
      // PUT /reminders/{id}
      console.log('Update reminder:', selectedReminder.id, formData);
      setReminders(reminders.map(r => 
        r.id === selectedReminder.id 
          ? { 
              ...r, 
              ...formData,
              updated_at: new Date().toISOString()
            } 
          : r
      ));
      toast({ title: 'Success', description: 'Reminder updated successfully' });
    } else {
      // POST /reminders
      const newReminder: Reminder = {
        id: Math.max(...reminders.map(r => r.id), 0) + 1,
        user_id: 1,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('Create reminder:', formData);
      setReminders([...reminders, newReminder]);
      toast({ title: 'Success', description: 'Reminder created successfully' });
    }

    setShowCreateDialog(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (selectedReminder) {
      // TODO: DELETE /reminders/{id}
      console.log('Delete reminder:', selectedReminder.id);
      setReminders(reminders.filter(r => r.id !== selectedReminder.id));
      toast({ title: 'Success', description: 'Reminder deleted successfully' });
    }
    setShowDeleteDialog(false);
    setSelectedReminder(null);
  };

  const handleToggleReminder = (reminder: Reminder) => {
    // TODO: PATCH /reminders/{id}/toggle
    console.log('Toggle reminder:', reminder.id);
    setReminders(reminders.map(r => 
      r.id === reminder.id ? { ...r, is_active: !r.is_active } : r
    ));
    toast({ 
      title: 'Success', 
      description: `Reminder ${!reminder.is_active ? 'enabled' : 'disabled'}` 
    });
  };

  const resetForm = () => {
    setFormData({
      reminder_type: 'Scheduled',
      title: '',
      description: '',
      scheduled_time: '',
      days_of_week: [],
      is_active: true,
    });
    setSelectedReminder(null);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const formatDays = (days: number[] | null) => {
    if (!days || days.length === 0) return 'No days selected';
    if (days.length === 7) return 'Every day';
    return days.map(d => daysOfWeek.find(dow => dow.value === d)?.label).join(', ');
  };

  const getReminderIcon = (type: string) => {
    const IconComponent = reminderTypes.find(t => t.value === type)?.icon || Bell;
    return IconComponent;
  };

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
          <PageHeader
            title="Workout Reminders"
            subtitle="Manage your workout notifications"
          >
            <Button onClick={handleCreateReminder} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Reminder
            </Button>
          </PageHeader>

          {/* Info Card */}
          <Card className="card-elevated bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">How reminders work</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reminders will appear as notifications while you're using the app. They check your workout activity and goals to show relevant alerts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders List */}
          {reminders.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="pt-12 pb-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No reminders yet</p>
                <Button onClick={handleCreateReminder} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className="card-elevated hover-scale transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                          {(() => {
                            const IconComponent = getReminderIcon(reminder.reminder_type);
                            return <IconComponent className="h-5 w-5 text-primary" />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{reminder.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {reminder.reminder_type}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {reminder.scheduled_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{reminder.scheduled_time}</span>
                              </div>
                            )}
                            {reminder.days_of_week && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDays(reminder.days_of_week)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={() => handleToggleReminder(reminder)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditReminder(reminder)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReminder(reminder)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Reminder' : 'Create New Reminder'}</DialogTitle>
                <DialogDescription>
                  Set up a reminder to help you stay on track with your fitness goals.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Reminder Type */}
                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select
                    value={formData.reminder_type}
                    onValueChange={(value: any) => setFormData({ ...formData, reminder_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reminderTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Evening Workout"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={200}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add additional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                {/* Scheduled Time - Only for Scheduled type */}
                {formData.reminder_type === 'Scheduled' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      />
                    </div>

                    {/* Days of Week */}
                    <div className="space-y-2">
                      <Label>Days of Week *</Label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={formData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleDay(day.value)}
                            className="w-14"
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <Label htmlFor="active">Enable this reminder</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveReminder}>
                  {isEditing ? 'Update' : 'Create'} Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{selectedReminder?.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
};

export default Reminders;
