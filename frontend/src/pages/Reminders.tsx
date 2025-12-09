import { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Calendar, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';
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
import { logger } from '@/lib/logger';
import { usePreferences } from '@/contexts/PreferencesContext';
import { reminderService, Reminder, ReminderCreate } from '@/services/reminderService';

const Reminders = () => {
  const { toast } = useToast();
  const { formatTime, preferences } = usePreferences();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    reminder_type: 'Scheduled' as Reminder['reminder_type'],
    title: '',
    description: '',
    scheduled_time: '',
    days_of_week: [] as number[],
    is_active: true,
  });

  // Helper: Convert 12h time to 24h format for backend storage
  const convertTo24h = (time12h: string): string => {
    if (!time12h.includes('AM') && !time12h.includes('PM')) {
      // Already 24h format
      return time12h;
    }
    
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Helper: Parse time input (handles both 12h and 24h)
  const parseTimeInput = (value: string): string => {
    // If user's preference is 24h, value is already in 24h format
    if (preferences.timeFormat === '24h') {
      return value;
    }
    // For 12h preference with time picker, convert to 24h for storage
    return convertTo24h(value);
  };

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  // Load reminders from API
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await reminderService.getAllReminders(forceRefresh);
      // Sort: Active reminders first, then by title alphabetically
      const sorted = data.sort((a, b) => {
        // First, sort by active status (active = true comes first)
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }
        // Then sort alphabetically by title (case-insensitive)
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
      setReminders(sorted);
    } catch (error) {
      logger.error('Failed to load reminders', error);
      toast({
        title: 'Error',
        description: 'Failed to load reminders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveReminder = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    // Check for duplicate names (case-insensitive)
    const duplicateName = reminders.find(
      r => r.title.toLowerCase() === formData.title.trim().toLowerCase() && 
      (!isEditing || r.id !== selectedReminder?.id)
    );
    if (duplicateName) {
      toast({ 
        title: 'Error', 
        description: 'A reminder with this name already exists. Please choose a different name.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!formData.scheduled_time) {
      toast({ title: 'Error', description: 'Time is required', variant: 'destructive' });
      return;
    }
    if (formData.days_of_week.length === 0) {
      toast({ title: 'Error', description: 'Select at least one day', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedReminder) {
        // Update existing reminder
        const updateData: any = {
          title: formData.title,
          description: formData.description || undefined,
          scheduled_time: formData.scheduled_time,
          days_of_week: formData.days_of_week,
          is_active: formData.is_active,
        };

        await reminderService.updateReminder(selectedReminder.id, updateData);
        toast({ title: 'Success', description: 'Reminder updated successfully' });
      } else {
        // Create new reminder
        const createData: ReminderCreate = {
          title: formData.title,
          description: formData.description || undefined,
          scheduled_time: formData.scheduled_time,
          days_of_week: formData.days_of_week,
          is_active: formData.is_active,
        };

        await reminderService.createReminder(createData);
        toast({ title: 'Success', description: 'Reminder created successfully' });
      }

      // Reload reminders with force refresh to bypass cache
      await loadReminders(true);
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      logger.error('Failed to save reminder', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to save reminder',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (selectedReminder) {
      try {
        await reminderService.deleteReminder(selectedReminder.id);
        toast({ title: 'Success', description: 'Reminder deleted successfully' });
        
        // Reload reminders with force refresh
        await loadReminders(true);
      } catch (error) {
        logger.error('Failed to delete reminder', error);
        toast({
          title: 'Error',
          description: 'Failed to delete reminder',
          variant: 'destructive',
        });
      }
    }
    setShowDeleteDialog(false);
    setSelectedReminder(null);
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      // Optimistically update the UI first
      const updatedReminders = reminders.map(r => 
        r.id === reminder.id ? { ...r, is_active: !r.is_active } : r
      );
      
      // Sort: Active reminders first, then alphabetically
      const sorted = updatedReminders.sort((a, b) => {
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
      
      setReminders(sorted);
      
      // Then update backend
      await reminderService.toggleReminder(reminder.id);
      toast({ 
        title: 'Success', 
        description: `Reminder ${!reminder.is_active ? 'enabled' : 'disabled'}` 
      });
      
      // Invalidate cache so next fetch gets fresh data
      reminderService.invalidateCache();
    } catch (error) {
      logger.error('Failed to toggle reminder', error);
      // Revert on error
      await loadReminders(true);
      toast({
        title: 'Error',
        description: 'Failed to toggle reminder',
        variant: 'destructive',
      });
    }
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
                    Set specific times and days for your workout reminders. You'll receive notifications starting 15 minutes before your scheduled time and up to 30 minutes after.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders List */}
          {loading ? (
            <Card className="card-elevated">
              <CardContent className="pt-12 pb-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading reminders...</p>
              </CardContent>
            </Card>
          ) : reminders.length === 0 ? (
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
                    {/* Mobile-friendly layout: stack on small screens, row on larger */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Main content area */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        
                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold break-words mb-1">{reminder.title}</h3>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mb-2 break-words">{reminder.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {reminder.scheduled_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{formatTime(reminder.scheduled_time)}</span>
                              </div>
                            )}
                            {reminder.days_of_week && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">{formatDays(reminder.days_of_week)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons - stack on mobile, row on desktop */}
                      <div className="flex sm:flex-col items-center justify-end sm:justify-start gap-2 flex-shrink-0">
                        <Switch
                          checked={reminder.is_active}
                          onCheckedChange={() => handleToggleReminder(reminder)}
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditReminder(reminder)}
                            className="h-9 w-9"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReminder(reminder)}
                            className="h-9 w-9"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
                  Set a specific time and days for your workout reminder.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
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

                {/* Scheduled Time */}
                <div className="space-y-2">
                  <Label htmlFor="time">Time * ({preferences.timeFormat === '12h' ? '12-hour' : '24-hour'})</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    step="60"
                    lang={preferences.timeFormat === '24h' ? 'en-GB' : 'en-US'}
                  />
                  {formData.scheduled_time && (
                    <p className="text-xs text-muted-foreground">
                      Displays as: {formatTime(formData.scheduled_time)}
                    </p>
                  )}
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
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveReminder} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{isEditing ? 'Update' : 'Create'} Reminder</>
                  )}
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
