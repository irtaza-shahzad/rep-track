import { useState, useEffect } from 'react';
import { Search, Dumbbell, Plus, Play, Edit2, Trash2, Heart, Zap, Bike } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import ExerciseSelector from '@/components/ExerciseSelector';
import { useWorkout } from '@/contexts/WorkoutContext';
import { STORAGE_KEYS } from '@/core/constants/AppConstants';
import { storageAdapter } from '@/infrastructure/storage/LocalStorageAdapter';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
  icon: any;
  isSystem?: boolean;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: string[];
  duration: string;
  restTime?: number; // in seconds
  notes?: string;
}

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasActiveWorkout } = useWorkout();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplate | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
  const [newExerciseDifficulty, setNewExerciseDifficulty] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showSystemOnly, setShowSystemOnly] = useState<boolean>(false);
  const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);

  const [exercises, setExercises] = useState<Exercise[]>([
    // Chest
    { id: '1', name: 'Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '2', name: 'Incline Barbell Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '3', name: 'Flat Dumbbell Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '4', name: 'Incline Dumbbell Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '5', name: 'Decline Bench Press', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '6', name: 'Chest Dips', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Advanced', icon: Dumbbell, isSystem: true },
    { id: '7', name: 'Cable Fly', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '8', name: 'Incline Cable Fly', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '9', name: 'Pec Deck Machine', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '10', name: 'Push-Ups', category: 'Strength', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Back
    { id: '11', name: 'Deadlift', category: 'Strength', muscleGroup: 'Back', difficulty: 'Advanced', icon: Dumbbell, isSystem: true },
    { id: '12', name: 'Pull-Ups', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '13', name: 'Chin-Ups', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '14', name: 'Lat Pulldown', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '15', name: 'Barbell Bent-Over Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '16', name: 'T-Bar Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '17', name: 'Seated Cable Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '18', name: 'Single-Arm Dumbbell Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '19', name: 'Chest-Supported Row', category: 'Strength', muscleGroup: 'Back', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '20', name: 'Face Pulls', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Legs
    { id: '21', name: 'Barbell Back Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '22', name: 'Barbell Front Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Advanced', icon: Dumbbell, isSystem: true },
    { id: '23', name: 'Leg Press', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '24', name: 'Romanian Deadlift', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '25', name: 'Conventional Deadlift', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Advanced', icon: Dumbbell, isSystem: true },
    { id: '26', name: 'Bulgarian Split Squat', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '27', name: 'Walking Lunges', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '28', name: 'Leg Extensions', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '29', name: 'Hamstring Curls', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '30', name: 'Hip Thrusts', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '31', name: 'Glute Bridges', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '32', name: 'Calf Raises', category: 'Strength', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Shoulders
    { id: '33', name: 'Overhead Barbell Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '34', name: 'Dumbbell Shoulder Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '35', name: 'Arnold Press', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '36', name: 'Lateral Raises', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '37', name: 'Cable Lateral Raises', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '38', name: 'Front Raises', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '39', name: 'Rear Delt Fly', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '40', name: 'Face Pulls', category: 'Strength', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Arms
    { id: '41', name: 'Barbell Bicep Curls', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '42', name: 'Dumbbell Hammer Curls', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '43', name: 'Preacher Curls', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '44', name: 'Tricep Pushdowns', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '45', name: 'Skull Crushers', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '46', name: 'Overhead Dumbbell Tricep Extension', category: 'Strength', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Core
    { id: '47', name: 'Planks', category: 'Strength', muscleGroup: 'Core', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '48', name: 'Hanging Leg Raises', category: 'Strength', muscleGroup: 'Core', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '49', name: 'Ab Wheel Rollouts', category: 'Strength', muscleGroup: 'Core', difficulty: 'Advanced', icon: Dumbbell, isSystem: true },
    { id: '50', name: 'Cable Woodchoppers', category: 'Strength', muscleGroup: 'Core', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    
    // Cardio
    { id: '51', name: 'Running', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Beginner', icon: Heart, isSystem: true },
    { id: '52', name: 'Cycling', category: 'Cardio', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Heart, isSystem: true },
    { id: '53', name: 'Jump Rope', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Heart, isSystem: true },
    { id: '54', name: 'Rowing Machine', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Heart, isSystem: true },
    { id: '55', name: 'Stair Climber', category: 'Cardio', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Heart, isSystem: true },
    { id: '56', name: 'Elliptical', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Beginner', icon: Heart, isSystem: true },
    { id: '57', name: 'Swimming', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Heart, isSystem: true },
    { id: '58', name: 'Burpees', category: 'Cardio', muscleGroup: 'FullBody', difficulty: 'Advanced', icon: Heart, isSystem: true },
    { id: '59', name: 'Mountain Climbers', category: 'Cardio', muscleGroup: 'Core', difficulty: 'Intermediate', icon: Heart, isSystem: true },
    { id: '60', name: 'High Knees', category: 'Cardio', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Heart, isSystem: true },
    
    // Flexibility
    { id: '61', name: 'Hamstring Stretch', category: 'Flexibility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '62', name: 'Quad Stretch', category: 'Flexibility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '63', name: 'Hip Flexor Stretch', category: 'Flexibility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '64', name: 'Shoulder Stretch', category: 'Flexibility', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '65', name: 'Chest Stretch', category: 'Flexibility', muscleGroup: 'Chest', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '66', name: 'Tricep Stretch', category: 'Flexibility', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '67', name: 'Cat-Cow Stretch', category: 'Flexibility', muscleGroup: 'Back', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '68', name: 'Seated Spinal Twist', category: 'Flexibility', muscleGroup: 'Core', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '69', name: "Child's Pose", category: 'Flexibility', muscleGroup: 'Back', difficulty: 'Beginner', icon: Zap, isSystem: true },
    { id: '70', name: 'Butterfly Stretch', category: 'Flexibility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Zap, isSystem: true },
    
    // Mobility
    { id: '71', name: 'Arm Circles', category: 'Mobility', muscleGroup: 'Shoulders', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '72', name: 'Leg Swings', category: 'Mobility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '73', name: 'Hip Circles', category: 'Mobility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '74', name: 'Ankle Rolls', category: 'Mobility', muscleGroup: 'Legs', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '75', name: 'Neck Rolls', category: 'Mobility', muscleGroup: 'Other', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '76', name: 'Wrist Circles', category: 'Mobility', muscleGroup: 'Arms', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '77', name: 'Torso Twists', category: 'Mobility', muscleGroup: 'Core', difficulty: 'Beginner', icon: Bike, isSystem: true },
    { id: '78', name: 'Walking Lunges', category: 'Mobility', muscleGroup: 'Legs', difficulty: 'Intermediate', icon: Bike, isSystem: true },
    { id: '79', name: 'Inchworms', category: 'Mobility', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Bike, isSystem: true },
    { id: '80', name: 'World Greatest Stretch', category: 'Mobility', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Bike, isSystem: true },
    
    // Other
    { id: '81', name: 'Yoga Flow', category: 'Other', muscleGroup: 'FullBody', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '82', name: 'Pilates Core Work', category: 'Other', muscleGroup: 'Core', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
    { id: '83', name: 'Foam Rolling', category: 'Other', muscleGroup: 'FullBody', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '84', name: 'Deep Breathing Exercises', category: 'Other', muscleGroup: 'Other', difficulty: 'Beginner', icon: Dumbbell, isSystem: true },
    { id: '85', name: 'Balance Training', category: 'Other', muscleGroup: 'FullBody', difficulty: 'Intermediate', icon: Dumbbell, isSystem: true },
  ]);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([
    { 
      id: '1', 
      name: 'Push Day', 
      exercises: ['Barbell Bench Press', 'Overhead Press', 'Tricep Extensions'], 
      duration: '45 min',
      restTime: 120,
      notes: 'Focus on compound movements with progressive overload'
    },
    { 
      id: '2', 
      name: 'Pull Day', 
      exercises: ['Deadlift', 'Pull-Ups', 'Barbell Bent-Over Row', 'Barbell Bicep Curls'], 
      duration: '60 min',
      restTime: 180,
      notes: 'Start with deadlifts when fresh, maintain proper form'
    },
    { 
      id: '3', 
      name: 'Leg Day', 
      exercises: ['Barbell Back Squat', 'Leg Press', 'Walking Lunges'], 
      duration: '50 min',
      restTime: 150,
      notes: 'High volume leg training - stay hydrated'
    },
  ]);

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Other'];
  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'FullBody'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // Helper function to get icon based on category
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Strength':
        return Dumbbell;
      case 'Cardio':
        return Heart;
      case 'Flexibility':
        return Zap;
      case 'Mobility':
        return Bike;
      default:
        return Dumbbell;
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
    const matchesDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
    const matchesType = (!showSystemOnly && !showCustomOnly) || 
      (showSystemOnly && ex.isSystem) || 
      (showCustomOnly && !ex.isSystem);
    
    return matchesSearch && matchesCategory && matchesMuscleGroup && matchesDifficulty && matchesType;
  });

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !newExerciseCategory || !newExerciseMuscleGroup || !newExerciseDifficulty) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      category: newExerciseCategory,
      muscleGroup: newExerciseMuscleGroup,
      difficulty: newExerciseDifficulty,
      icon: getCategoryIcon(newExerciseCategory),
    };

    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
    setNewExerciseCategory('');
    setNewExerciseMuscleGroup('');
    setNewExerciseDifficulty('');
    setIsAddExerciseOpen(false);
    
    toast({
      title: "Exercise Added",
      description: `${newExerciseName} has been added to your library`,
    });
  };

  const handleDeleteExercise = (id: string, name: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    toast({
      title: "Exercise Deleted",
      description: `${name} has been removed`,
    });
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one exercise",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: WorkoutTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      exercises: selectedExercises,
      duration: `${selectedExercises.length * 15} min`,
      notes: newTemplateDescription || undefined,
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    storageAdapter.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSelectedExercises([]);
    setIsAddTemplateOpen(false);
    
    toast({
      title: "Template Created",
      description: `${newTemplateName} has been saved`,
    });
  };

  const handleStartWorkout = (template: WorkoutTemplate) => {
    // Check if there's already an active workout
    if (hasActiveWorkout()) {
      toast({
        title: "Workout Already Active",
        description: "You have an active workout in progress. Please finish it first or click the indicator at the top to resume.",
        variant: "destructive"
      });
      return;
    }
    navigate('/workout', { state: { template } });
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.notes || '');
    // Create a completely fresh copy of exercises array
    setSelectedExercises([...template.exercises]);
    setIsEditTemplateOpen(true);
  };

  const handleViewTemplate = (template: WorkoutTemplate) => {
    setViewingTemplate(template);
    setIsViewTemplateOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplateName.trim() || selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one exercise",
        variant: "destructive",
      });
      return;
    }

    const updatedTemplate: WorkoutTemplate = {
      ...editingTemplate,
      name: newTemplateName,
      exercises: [...selectedExercises],
      duration: `${selectedExercises.length * 15} min`,
      notes: newTemplateDescription || undefined,
    };

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    
    setTemplates(updatedTemplates);
    storageAdapter.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setSelectedExercises([]);
    setEditingTemplate(null);
    setIsEditTemplateOpen(false);
    
    toast({
      title: "Template Updated",
      description: `${newTemplateName} has been updated`,
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    storageAdapter.set(STORAGE_KEYS.WORKOUT_TEMPLATES, updatedTemplates);
    toast({
      title: "Template Deleted",
      description: `${name} has been removed`,
    });
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

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <PageHeader 
          title="Exercises" 
          subtitle="Manage exercises and workout templates"
        />

        <Tabs defaultValue="exercises" className="animate-slide-up">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-6">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Muscle Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Muscles</SelectItem>
                    {muscleGroups.map((muscle) => (
                      <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button 
                    variant={showSystemOnly ? "default" : "outline"} 
                    onClick={() => {
                      setShowSystemOnly(!showSystemOnly);
                      setShowCustomOnly(false);
                    }}
                    className="flex-1"
                  >
                    System
                  </Button>
                  <Button 
                    variant={showCustomOnly ? "default" : "outline"} 
                    onClick={() => {
                      setShowCustomOnly(!showCustomOnly);
                      setShowSystemOnly(false);
                    }}
                    className="flex-1"
                  >
                    Custom
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Add */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              
              <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Custom Exercise</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="exercise-name">Exercise Name</Label>
                      <Input
                        id="exercise-name"
                        placeholder="e.g., Hammer Curls"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newExerciseCategory} onValueChange={setNewExerciseCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="muscle-group">Muscle Group</Label>
                      <Select value={newExerciseMuscleGroup} onValueChange={setNewExerciseMuscleGroup}>
                        <SelectTrigger id="muscle-group">
                          <SelectValue placeholder="Select muscle group" />
                        </SelectTrigger>
                        <SelectContent>
                          {muscleGroups.map((muscle) => (
                            <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={newExerciseDifficulty} onValueChange={setNewExerciseDifficulty}>
                        <SelectTrigger id="difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((diff) => (
                            <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddExercise} className="w-full">
                      Add Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredExercises.map((exercise) => {
                const Icon = exercise.icon;
                return (
                  <Card
                    key={exercise.id}
                    className="card-elevated hover-scale"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{exercise.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{exercise.category}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {exercise.muscleGroup}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              exercise.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-600' :
                              exercise.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-red-500/10 text-red-600'
                            }`}>
                              {exercise.difficulty}
                            </span>
                            {exercise.isSystem && (
                              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                System
                              </span>
                            )}
                          </div>
                        </div>
                        {!exercise.isSystem && (
                          <button
                            onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No exercises found matching your search.</p>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="mb-6 flex justify-end">
              <Dialog open={isAddTemplateOpen} onOpenChange={(open) => {
                setIsAddTemplateOpen(open);
                if (!open) {
                  // Reset state when closing
                  setSelectedExercises([]);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Create Workout Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 overflow-y-auto flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        placeholder="e.g., Upper Body Blast"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-description">Description (Optional)</Label>
                      <Input
                        id="template-description"
                        placeholder="e.g., Focus on compound movements"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Select Exercises</Label>
                      <ExerciseSelector
                        key="create-template"
                        exercises={exercises}
                        selectedExercises={selectedExercises}
                        onSelect={toggleExerciseSelection}
                        multiSelect={true}
                        showSelectedCount={true}
                      />
                    </div>
                    <Button onClick={handleAddTemplate} className="w-full">
                      Create Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Template Dialog */}
            <Dialog open={isEditTemplateOpen} onOpenChange={(open) => {
              setIsEditTemplateOpen(open);
              if (!open) {
                // Reset state when closing
                setSelectedExercises([]);
                setEditingTemplate(null);
                setNewTemplateName('');
                setNewTemplateDescription('');
              }}
            }>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Edit Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="edit-template-name">Template Name</Label>
                    <Input
                      id="edit-template-name"
                      placeholder="e.g., Upper Body Blast"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-template-description">Description (Optional)</Label>
                    <Input
                      id="edit-template-description"
                      placeholder="e.g., Focus on compound movements"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Exercises</Label>
                    <ExerciseSelector
                      key={editingTemplate?.id || 'edit'}
                      exercises={exercises}
                      selectedExercises={selectedExercises}
                      onSelect={toggleExerciseSelection}
                      multiSelect={true}
                      showSelectedCount={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditTemplateOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateTemplate} className="flex-1">
                      Update Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View Template Dialog */}
            <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>View Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {viewingTemplate && (
                    <>
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <p className="text-base font-medium">{viewingTemplate.name}</p>
                      </div>
                      {viewingTemplate.notes && (
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground">{viewingTemplate.notes}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <p className="text-sm">{viewingTemplate.duration}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Exercises ({viewingTemplate.exercises.length})</Label>
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                          <div className="space-y-2">
                            {viewingTemplate.exercises.map((exerciseName, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}.</span>
                                <span className="text-sm">{exerciseName}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsViewTemplateOpen(false)} className="flex-1">
                          Close
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsViewTemplateOpen(false);
                            handleStartWorkout(viewingTemplate);
                          }} 
                          className="flex-1"
                        >
                          Start Workout
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="card-elevated cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{template.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {template.duration}
                          </span>
                          {template.restTime && (
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                              Rest: {template.restTime}s
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {template.exercises.length} exercises
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id, template.name);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Notes */}
                      {template.notes && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground italic">{template.notes}</p>
                        </div>
                      )}
                      
                      {/* Exercises List - Show first 3, then "..." */}
                      <div className="space-y-1">
                        {template.exercises.slice(0, 3).map((ex, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                            <Dumbbell className="h-3 w-3" />
                            {ex}
                          </div>
                        ))}
                        {template.exercises.length > 3 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 p-2">
                            <span className="text-xs font-medium text-primary">...</span>
                            <span className="italic">and {template.exercises.length - 3} more</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWorkout(template);
                          }}
                          className="flex-1 rounded-xl"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Workout
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          title="Edit template"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No templates yet. Create your first workout template!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ExerciseLibrary;
