/**
 * Template form state and handlers
 * Extracted from ExerciseLibrary for better modularity
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { templateService, TemplateExercise } from '@/services/templateService';
import { logger } from '@/lib/logger';

export interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: string[];
  duration: string;
  restTime?: number;
  notes?: string;
  template_exercises?: TemplateExercise[];
}

export interface UseTemplateFormReturn {
  // Form state
  newTemplateName: string;
  setNewTemplateName: (value: string) => void;
  newTemplateDescription: string;
  setNewTemplateDescription: (value: string) => void;
  selectedExercises: string[];
  setSelectedExercises: React.Dispatch<React.SetStateAction<string[]>>;
  submitting: boolean;
  
  // Handlers
  resetForm: () => void;
  handleAddTemplate: (
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>,
    onSuccess?: () => void
  ) => Promise<void>;
  handleUpdateTemplate: (
    editingTemplate: WorkoutTemplate,
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>,
    onSuccess?: () => void
  ) => Promise<void>;
  handleDeleteTemplate: (
    id: number,
    name: string,
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>
  ) => Promise<void>;
  populateFormForEdit: (template: WorkoutTemplate) => void;
  toggleExerciseSelection: (exerciseName: string) => void;
}

export const useTemplateForm = (): UseTemplateFormReturn => {
  const { toast } = useToast();
  
  // Form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSelectedExercises([]);
  };

  const populateFormForEdit = (template: WorkoutTemplate) => {
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.notes || '');
    setSelectedExercises([...template.exercises]);
  };

  const toggleExerciseSelection = (exerciseName: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseName)) {
        return prev.filter(e => e !== exerciseName);
      } else {
        return [...prev, exerciseName];
      }
    });
  };

  const handleAddTemplate = async (
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>,
    onSuccess?: () => void
  ) => {
    if (!newTemplateName.trim() || selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one exercise",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const templateExercises: TemplateExercise[] = selectedExercises.map((exerciseName, index) => ({
        exercise_name: exerciseName,
        position: index + 1,
        sets: 3,
        reps: 10,
        rest_seconds: 60
      }));

      const newTemplate = await templateService.createTemplate({
        name: newTemplateName,
        description: newTemplateDescription || undefined,
        exercises: templateExercises,
      });

      setTemplates(prev => [...prev, {
        id: newTemplate.id!,
        name: newTemplate.name,
        exercises: newTemplate.template_exercises?.map(e => e.exercise_name) || [],
        duration: `${(newTemplate.template_exercises?.length || 0) * 15} min`,
        notes: newTemplate.description,
        template_exercises: newTemplate.template_exercises
      }]);

      resetForm();
      
      toast({
        title: "Template Created",
        description: `${newTemplateName} has been saved`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to create template', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTemplate = async (
    editingTemplate: WorkoutTemplate,
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>,
    onSuccess?: () => void
  ) => {
    if (!newTemplateName.trim() || selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one exercise",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const templateExercises: TemplateExercise[] = selectedExercises.map((exerciseName, index) => ({
        exercise_name: exerciseName,
        position: index + 1,
        sets: 3,
        reps: 10,
        rest_seconds: 60
      }));

      const updatedTemplate = await templateService.updateTemplate(editingTemplate.id, {
        name: newTemplateName,
        description: newTemplateDescription || undefined,
        exercises: templateExercises,
      });

      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id ? {
          id: updatedTemplate.id!,
          name: updatedTemplate.name,
          exercises: updatedTemplate.template_exercises?.map(e => e.exercise_name) || [],
          duration: `${(updatedTemplate.template_exercises?.length || 0) * 15} min`,
          notes: updatedTemplate.description,
          template_exercises: updatedTemplate.template_exercises
        } : t
      ));

      resetForm();
      
      toast({
        title: "Template Updated",
        description: `${newTemplateName} has been updated`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      logger.error('Failed to update template', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (
    id: number,
    name: string,
    templates: WorkoutTemplate[],
    setTemplates: React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>
  ) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "Template Deleted",
        description: `${name} has been removed`,
      });
    } catch (error: any) {
      logger.error('Failed to delete template', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  return {
    newTemplateName,
    setNewTemplateName,
    newTemplateDescription,
    setNewTemplateDescription,
    selectedExercises,
    setSelectedExercises,
    submitting,
    resetForm,
    handleAddTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
    populateFormForEdit,
    toggleExerciseSelection,
  };
};
