/**
 * Template Form Dialog Component
 * Reusable dialog for creating/editing workout templates
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ExerciseSelector from '@/components/ExerciseSelector';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
}

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  // Form values
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  selectedExercises: string[];
  onExerciseSelect: (exerciseName: string) => void;
  // Actions
  onSubmit: () => void;
  submitting: boolean;
  // Data
  availableExercises: Exercise[];
}

const TemplateFormDialog = ({
  open,
  onOpenChange,
  isEditing,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  selectedExercises,
  onExerciseSelect,
  onSubmit,
  submitting,
  availableExercises,
}: TemplateFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Workout Template' : 'Create Workout Template'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g., Push Day"
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Optional notes about this template"
              />
            </div>
            <div>
              <Label>Select Exercises *</Label>
              <ExerciseSelector
                exercises={availableExercises}
                selectedExercises={selectedExercises}
                onSelect={onExerciseSelect}
              />
            </div>
            <Button onClick={onSubmit} className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateFormDialog;
