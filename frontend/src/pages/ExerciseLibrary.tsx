import { useState, useEffect } from 'react';
import { Search, Dumbbell, Plus, Play, Edit2, Trash2, Heart, Zap, Bike, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PageHeader from '@/components/PageHeader';
import ExerciseSelector from '@/components/ExerciseSelector';
import { useWorkout } from '@/contexts/WorkoutContext';
import { exerciseService, Exercise as APIExercise, Category, Difficulty, MuscleGroup } from '@/services/exerciseService';
import { templateService, WorkoutTemplate as APIWorkoutTemplate, TemplateExercise } from '@/services/templateService';

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
  description?: string;
  icon: any;
  isSystem?: boolean;
}

interface WorkoutTemplate {
  id: number;
  name: string;
  exercises: string[];
  duration: string;
  restTime?: number;
  notes?: string;
  template_exercises?: TemplateExercise[];
}

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasActiveWorkout } = useWorkout();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showSystemOnly, setShowSystemOnly] = useState<boolean>(false);
  const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);
  
  // Dialog states
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplate | null>(null);
  
  // Form states
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseDescription, setNewExerciseDescription] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
  const [newExerciseDifficulty, setNewExerciseDifficulty] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // Data states
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const categories: Category[] = ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Other'];
  const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Other'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  // Load data on mount
  useEffect(() => {
    loadExercises();
    loadTemplates();
  }, []);

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

  // Load exercises from API
  const loadExercises = async () => {
    try {
      setLoading(true);
      const apiExercises = await exerciseService.getAllExercises();
      
      // Transform API data to match UI format
      const transformed = apiExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        muscleGroup: ex.muscle_group.replace(' ', ''),
        difficulty: ex.difficulty,
        description: ex.description,
        icon: getCategoryIcon(ex.category),
        isSystem: !ex.user_id // Global exercises have no user_id
      }));
      
      setExercises(transformed);
    } catch (error: any) {
      toast({
        title: "Error Loading Exercises",
        description: error.response?.data?.message || "Failed to load exercises from server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load templates from API
  const loadTemplates = async () => {
    try {
      const apiTemplates = await templateService.getAllTemplates();
      
      // Transform API data to UI format
      const transformed = apiTemplates.map(t => ({
        id: t.id!,
        name: t.name,
        exercises: t.template_exercises?.map(e => e.exercise_name) || [],
        duration: `${(t.template_exercises?.length || 0) * 15} min`,
        notes: t.description,
        template_exercises: t.template_exercises
      }));
      
      setTemplates(transformed);
    } catch (error: any) {
      toast({
        title: "Error Loading Templates",
        description: error.response?.data?.message || "Failed to load templates from server",
        variant: "destructive",
      });
    }
  };

  // Filter exercises
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

  // Add new exercise
  const handleAddExercise = async () => {
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

      // Add to local state
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

      // Reset form
      setNewExerciseName('');
      setNewExerciseDescription('');
      setNewExerciseCategory('');
      setNewExerciseMuscleGroup('');
      setNewExerciseDifficulty('');
      setIsAddExerciseOpen(false);
      
      toast({
        title: "Exercise Added",
        description: `${newExerciseName} has been added to your library`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add exercise",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete exercise
  const handleDeleteExercise = async (id: number, name: string, isSystem?: boolean) => {
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
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  // Add new template
  const handleAddTemplate = async () => {
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
      
      // Create template exercises from selected exercise names
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

      // Add to local state
      setTemplates(prev => [...prev, {
        id: newTemplate.id!,
        name: newTemplate.name,
        exercises: newTemplate.template_exercises?.map(e => e.exercise_name) || [],
        duration: `${(newTemplate.template_exercises?.length || 0) * 15} min`,
        notes: newTemplate.description,
        template_exercises: newTemplate.template_exercises
      }]);

      // Reset form
      setNewTemplateName('');
      setNewTemplateDescription('');
      setSelectedExercises([]);
      setIsAddTemplateOpen(false);
      
      toast({
        title: "Template Created",
        description: `${newTemplateName} has been saved`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update template
  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !newTemplateName.trim() || selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and select at least one exercise",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create template exercises from selected exercise names
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

      // Update local state
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

      // Reset form
      setNewTemplateName('');
      setNewTemplateDescription('');
      setSelectedExercises([]);
      setEditingTemplate(null);
      setIsEditTemplateOpen(false);
      
      toast({
        title: "Template Updated",
        description: `${newTemplateName} has been updated`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: number, name: string) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "Template Deleted",
        description: `${name} has been removed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  // Start workout from template
  const handleStartWorkout = (template: WorkoutTemplate) => {
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

  // Edit template
  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.notes || '');
    setSelectedExercises([...template.exercises]);
    setIsEditTemplateOpen(true);
  };

  // View template
  const handleViewTemplate = (template: WorkoutTemplate) => {
    setViewingTemplate(template);
    setIsViewTemplateOpen(true);
  };

  // Toggle exercise selection for templates
  const toggleExerciseSelection = (exerciseName: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseName)) {
        return prev.filter(e => e !== exerciseName);
      } else {
        return [...prev, exerciseName];
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

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

            {/* EXERCISES TAB */}
            <TabsContent value="exercises" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Muscle Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Muscle Groups</SelectItem>
                          {muscleGroups.map(mg => (
                            <SelectItem key={mg} value={mg.replace(' ', '')}>{mg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Difficulties</SelectItem>
                          {difficulties.map(diff => (
                            <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant={showSystemOnly ? "default" : "outline"}
                        onClick={() => {
                          setShowSystemOnly(!showSystemOnly);
                          setShowCustomOnly(false);
                        }}
                      >
                        System Only
                      </Button>
                      <Button
                        variant={showCustomOnly ? "default" : "outline"}
                        onClick={() => {
                          setShowCustomOnly(!showCustomOnly);
                          setShowSystemOnly(false);
                        }}
                      >
                        Custom Only
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Exercise Button */}
              <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Custom Exercise
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Exercise</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Exercise Name *</Label>
                      <Input
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="e.g., Barbell Squat"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newExerciseDescription}
                        onChange={(e) => setNewExerciseDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={newExerciseCategory} onValueChange={setNewExerciseCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Muscle Group *</Label>
                      <Select value={newExerciseMuscleGroup} onValueChange={setNewExerciseMuscleGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select muscle group" />
                        </SelectTrigger>
                        <SelectContent>
                          {muscleGroups.map(mg => (
                            <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Difficulty *</Label>
                      <Select value={newExerciseDifficulty} onValueChange={setNewExerciseDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map(diff => (
                            <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddExercise} className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Add Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Exercise List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((exercise) => {
                  const Icon = exercise.icon;
                  return (
                    <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-base">{exercise.name}</CardTitle>
                              {exercise.isSystem && (
                                <span className="text-xs text-muted-foreground">System</span>
                              )}
                            </div>
                          </div>
                          {!exercise.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExercise(exercise.id, exercise.name, exercise.isSystem)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span>{exercise.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Muscle:</span>
                            <span>{exercise.muscleGroup}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Difficulty:</span>
                            <span>{exercise.difficulty}</span>
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-muted-foreground mt-2">{exercise.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredExercises.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No exercises found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="space-y-6">
              {/* Add Template Button */}
              <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Create New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Create Workout Template</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Template Name *</Label>
                        <Input
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="e.g., Push Day"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newTemplateDescription}
                          onChange={(e) => setNewTemplateDescription(e.target.value)}
                          placeholder="Optional notes about this template"
                        />
                      </div>
                      <div>
                        <Label>Select Exercises *</Label>
                        <ExerciseSelector
                          exercises={exercises.map(e => ({ ...e, id: e.id.toString() }))}
                          selectedExercises={selectedExercises}
                          onSelect={toggleExerciseSelection}
                        />
                      </div>
                      <Button onClick={handleAddTemplate} className="w-full" disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Template
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* Edit Template Dialog */}
              <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Edit Workout Template</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Template Name *</Label>
                        <Input
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="e.g., Push Day"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newTemplateDescription}
                          onChange={(e) => setNewTemplateDescription(e.target.value)}
                          placeholder="Optional notes about this template"
                        />
                      </div>
                      <div>
                        <Label>Select Exercises *</Label>
                        <ExerciseSelector
                          exercises={exercises.map(e => ({ ...e, id: e.id.toString() }))}
                          selectedExercises={selectedExercises}
                          onSelect={toggleExerciseSelection}
                        />
                      </div>
                      <Button onClick={handleUpdateTemplate} className="w-full" disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Template
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {/* View Template Dialog */}
              <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{viewingTemplate?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {viewingTemplate?.notes && (
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground">{viewingTemplate.notes}</p>
                      </div>
                    )}
                    <div>
                      <Label>Exercises ({viewingTemplate?.exercises.length})</Label>
                      <ul className="mt-2 space-y-1">
                        {viewingTemplate?.exercises.map((ex, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleStartWorkout(viewingTemplate!)} className="flex-1">
                        <Play className="mr-2 h-4 w-4" /> Start Workout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewTemplateOpen(false);
                          handleEditTemplate(viewingTemplate!);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Template List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{template.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.exercises.length} exercises • {template.duration}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id, template.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {template.notes && (
                          <p className="text-sm text-muted-foreground">{template.notes}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStartWorkout(template)}
                            className="flex-1"
                          >
                            <Play className="mr-2 h-4 w-4" /> Start
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleViewTemplate(template)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
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
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No templates created yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Create your first workout template above</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ExerciseLibrary;
