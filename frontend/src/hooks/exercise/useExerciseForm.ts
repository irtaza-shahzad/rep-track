/**
 * Exercise form state and handlers
 * Extracted from ExerciseLibrary for better modularity
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { exerciseService, Category, Difficulty, MuscleGroup } from '@/services/exerciseService';
import { logger } from '@/lib/logger';

export interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
  description?: string;
  icon: any;
  isSystem?: boolean;
}

export interface UseExerciseFormReturn {
  // Form state
  newExerciseName: string;
  setNewExerciseName: (value: string) => void;
  newExerciseDescription: string;
  setNewExerciseDescription: (value: string) => void;
  newExerciseCategory: string;
  setNewExerciseCategory: (value: string) => void;
  newExerciseMuscleGroup: string;
  setNewExerciseMuscleGroup: (value: string) => void;
  newExerciseDifficulty: string;
  setNewExerciseDifficulty: (value: string) => void;
  submitting: boolean;
  
  // Handlers
  resetForm: () => void;
  handleAddExercise: (
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
    getCategoryIcon: (category: string) => any,
    onSuccess?: () => void
  ) => Promise<void>;
  handleUpdateExercise: (
    editingExercise: Exercise,
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
    getCategoryIcon: (category: string) => any,
    onSuccess?: () => void
  ) => Promise<void>;
  handleDeleteExercise: (
    id: number,
    name: string,
    isSystem: boolean | undefined,
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>
  ) => Promise<void>;
  populateFormForEdit: (exercise: Exercise) => void;
}

export const useExerciseForm = (): UseExerciseFormReturn => {
  const { toast } = useToast();
  
  // Form state
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
  const [newExerciseDifficulty, setNewExerciseDifficulty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNewExerciseName('');
    setNewExerciseDescription('');
    setNewExerciseCategory('');
    setNewExerciseMuscleGroup('');
    setNewExerciseDifficulty('');
  };

  const populateFormForEdit = (exercise: Exercise) => {
    setNewExerciseName(exercise.name);
    setNewExerciseDescription(exercise.description || '');
    setNewExerciseCategory(exercise.category);
    // Convert "FullBody" to "Full Body"
    setNewExerciseMuscleGroup(exercise.muscleGroup.replace(/([A-Z])/g, ' $1').trim());
    setNewExerciseDifficulty(exercise.difficulty);
  };

  const handleAddExercise = async (
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
    getCategoryIcon: (category: string) => any,
    onSuccess?: () => void
  ) => {
    if (!newExerciseName.trim() || !newExerciseCategory || !newExerciseMuscleGroup || !newExerciseDifficulty) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const newExercise = await exerciseService.createExercise({
        name: newExerciseName,
        description: newExerciseDescription || undefined,
        category: newExerciseCategory as Category,
        muscle_group: newExerciseMuscleGroup as MuscleGroup,
        difficulty: newExerciseDifficulty as Difficulty,
      });

      setExercises(prev => [...prev, {
        id: newExercise.id,
        name: newExercise.name,
        category: newExercise.category,
        muscleGroup: newExercise.muscle_group.replace(' ', ''),
        difficulty: newExercise.difficulty,
        description: newExercise.description,
        icon: getCategoryIcon(newExercise.category),
        isSystem: false
      }]);

      resetForm();
      
      toast({
        title: "Exercise Added",
        description: `${newExerciseName} has been added to your library`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to add exercise', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add exercise",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExercise = async (
    editingExercise: Exercise,
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>,
    getCategoryIcon: (category: string) => any,
    onSuccess?: () => void
  ) => {
    if (!newExerciseName.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const updatedExercise = await exerciseService.updateExercise(editingExercise.id, {
        name: newExerciseName !== editingExercise.name ? newExerciseName : undefined,
        description: newExerciseDescription || undefined,
        category: newExerciseCategory as Category,
        muscle_group: newExerciseMuscleGroup as MuscleGroup,
        difficulty: newExerciseDifficulty as Difficulty,
      });

      setExercises(prev => prev.map(ex => 
        ex.id === editingExercise.id ? {
          ...ex,
          name: updatedExercise.name,
          category: updatedExercise.category,
          muscleGroup: updatedExercise.muscle_group.replace(' ', ''),
          difficulty: updatedExercise.difficulty,
          description: updatedExercise.description,
          icon: getCategoryIcon(updatedExercise.category),
        } : ex
      ));

      resetForm();
      
      toast({
        title: "Exercise Updated",
        description: `${editingExercise.name} has been updated`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to update exercise', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update exercise",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExercise = async (
    id: number,
    name: string,
    isSystem: boolean | undefined,
    exercises: Exercise[],
    setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>
  ) => {
    if (isSystem) {
      toast({
        title: "Cannot Delete",
        description: "System exercises cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    try {
      await exerciseService.deleteExercise(id);
      setExercises(prev => prev.filter(ex => ex.id !== id));
      
      toast({
        title: "Exercise Deleted",
        description: `${name} has been removed`,
      });
    } catch (error: any) {
      logger.error('Failed to delete exercise', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  return {
    newExerciseName,
    setNewExerciseName,
    newExerciseDescription,
    setNewExerciseDescription,
    newExerciseCategory,
    setNewExerciseCategory,
    newExerciseMuscleGroup,
    setNewExerciseMuscleGroup,
    newExerciseDifficulty,
    setNewExerciseDifficulty,
    submitting,
    resetForm,
    handleAddExercise,
    handleUpdateExercise,
    handleDeleteExercise,
    populateFormForEdit,
  };
};
