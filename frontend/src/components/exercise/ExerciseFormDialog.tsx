/**
 * Exercise Form Dialog Component
 * Reusable dialog for adding/editing exercises
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Category, Difficulty, MuscleGroup } from '@/services/exerciseService';

interface ExerciseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  // Form values
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  muscleGroup: string;
  onMuscleGroupChange: (value: string) => void;
  difficulty: string;
  onDifficultyChange: (value: string) => void;
  // Actions
  onSubmit: () => void;
  submitting: boolean;
  // Options
  categories: Category[];
  muscleGroups: MuscleGroup[];
  difficulties: Difficulty[];
}

const ExerciseFormDialog = ({
  open,
  onOpenChange,
  isEditing,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  category,
  onCategoryChange,
  muscleGroup,
  onMuscleGroupChange,
  difficulty,
  onDifficultyChange,
  onSubmit,
  submitting,
  categories,
  muscleGroups,
  difficulties,
}: ExerciseFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Exercise' : 'Add Custom Exercise'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="exercise-name">Exercise Name *</Label>
              <Input
                id="exercise-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g., Bulgarian Split Squat"
              />
            </div>
            <div>
              <Label htmlFor="exercise-description">Description</Label>
              <Textarea
                id="exercise-description"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Optional notes about the exercise"
              />
            </div>
            <div>
              <Label htmlFor="exercise-category">Category *</Label>
              <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger id="exercise-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exercise-muscle">Muscle Group *</Label>
              <Select value={muscleGroup} onValueChange={onMuscleGroupChange}>
                <SelectTrigger id="exercise-muscle">
                  <SelectValue placeholder="Select muscle group" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((mg) => (
                    <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exercise-difficulty">Difficulty *</Label>
              <Select value={difficulty} onValueChange={onDifficultyChange}>
                <SelectTrigger id="exercise-difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onSubmit} className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Update Exercise' : 'Add Exercise'}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseFormDialog;
