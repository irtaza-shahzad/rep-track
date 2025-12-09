import { useState, useEffect, useMemo } from 'react';
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
import { exerciseService, Category, Difficulty, MuscleGroup } from '@/services/exerciseService';
import { templateService, TemplateExercise } from '@/services/templateService';
import { useExerciseForm, Exercise } from '@/hooks/exercise/useExerciseForm';
import { useTemplateForm, WorkoutTemplate } from '@/hooks/exercise/useTemplateForm';
import ExerciseFormDialog from '@/components/exercise/ExerciseFormDialog';
import TemplateFormDialog from '@/components/exercise/TemplateFormDialog';

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasActiveWorkout } = useWorkout();
  
  // Use custom hooks for form logic
  const exerciseForm = useExerciseForm();
  const templateForm = useTemplateForm();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showSystemOnly, setShowSystemOnly] = useState<boolean>(false);
  const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(15);
  
  // Dialog states
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isEditExerciseOpen, setIsEditExerciseOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplate | null>(null);
  
  // Data states
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [templatesLoaded, setTemplatesLoaded] = useState<boolean>(false);
  const [templateDisplayLimit, setTemplateDisplayLimit] = useState<number>(15);

  const categories: Category[] = ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Other'];
  const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Other'];
  const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

  // Load data on mount - only load exercises initially
  useEffect(() => {
    loadExercises();
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
    }
  };
  // Load templates from API (lazy loaded)
  const loadTemplates = async () => {
    if (templatesLoaded) return; // Don't reload if already loaded
    
    try {
      setTemplatesLoading(true);
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
      setTemplatesLoaded(true);
    } catch (error: any) {
      toast({
        title: "Error Loading Templates",
        description: error.response?.data?.message || "Failed to load templates from server",
        variant: "destructive",
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Filter exercises - memoized to prevent re-filtering on every render
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
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
  }, [exercises, searchQuery, selectedCategory, selectedMuscleGroup, selectedDifficulty, showSystemOnly, showCustomOnly]);

  // Display only limited exercises initially for better performance
  const displayedExercises = useMemo(() => {
    return filteredExercises.slice(0, displayLimit);
  }, [filteredExercises, displayLimit]);

  const hasMoreExercises = filteredExercises.length > displayLimit;

  // Exercise handlers - use hook-based logic
  const handleAddExercise = () => exerciseForm.handleAddExercise(
    exercises,
    setExercises,
    getCategoryIcon,
    () => setIsAddExerciseOpen(false)
  );

  const handleDeleteExercise = (id: number, name: string, isSystem?: boolean) =>
    exerciseForm.handleDeleteExercise(id, name, isSystem, exercises, setExercises);

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    exerciseForm.populateFormForEdit(exercise);
    setIsEditExerciseOpen(true);
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;
    exerciseForm.handleUpdateExercise(
      editingExercise,
      exercises,
      setExercises,
      getCategoryIcon,
      () => {
        setEditingExercise(null);
        setIsEditExerciseOpen(false);
      }
    );
  };

  // Template handlers - use hook-based logic
  const handleAddTemplate = () => templateForm.handleAddTemplate(
    templates,
    setTemplates,
    () => setIsAddTemplateOpen(false)
  );

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    templateForm.handleUpdateTemplate(
      editingTemplate,
      templates,
      setTemplates,
      () => {
        setEditingTemplate(null);
        setIsEditTemplateOpen(false);
      }
    );
  };

  const handleDeleteTemplate = (id: number, name: string) =>
    templateForm.handleDeleteTemplate(id, name, templates, setTemplates);

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
    templateForm.populateFormForEdit(template);
    setIsEditTemplateOpen(true);
  };

  // View template
  const handleViewTemplate = (template: WorkoutTemplate) => {
    setViewingTemplate(template);
    setIsViewTemplateOpen(true);
  };

  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <PageHeader 
            title="Exercises" 
            subtitle="Manage exercises and workout templates"
          />

          <Tabs defaultValue="exercises" className="animate-slide-up" onValueChange={(value) => {
            // Lazy load templates when tab is switched
            if (value === 'templates' && !templatesLoaded) {
              loadTemplates();
            }
          }}>
            <TabsList className="mb-6 w-full grid grid-cols-2">
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* EXERCISES TAB */}
            <TabsContent value="exercises" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-6">
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
              <Dialog open={isAddExerciseOpen} onOpenChange={(open) => {
                setIsAddExerciseOpen(open);
                if (!open) exerciseForm.resetForm();
              }}>
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
                        value={exerciseForm.newExerciseName}
                        onChange={(e) => exerciseForm.setNewExerciseName(e.target.value)}
                        placeholder="e.g., Barbell Squat"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exerciseForm.newExerciseDescription}
                        onChange={(e) => exerciseForm.setNewExerciseDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={exerciseForm.newExerciseCategory} onValueChange={exerciseForm.setNewExerciseCategory}>
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
                      <Select value={exerciseForm.newExerciseMuscleGroup} onValueChange={exerciseForm.setNewExerciseMuscleGroup}>
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
                      <Select value={exerciseForm.newExerciseDifficulty} onValueChange={exerciseForm.setNewExerciseDifficulty}>
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
                    <Button onClick={handleAddExercise} className="w-full" disabled={exerciseForm.submitting}>
                      {exerciseForm.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Add Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Exercise Dialog */}
              <Dialog open={isEditExerciseOpen} onOpenChange={(open) => {
                setIsEditExerciseOpen(open);
                if (!open) {
                  exerciseForm.resetForm();
                  setEditingExercise(null);
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Exercise</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Exercise Name *</Label>
                      <Input
                        value={exerciseForm.newExerciseName}
                        onChange={(e) => exerciseForm.setNewExerciseName(e.target.value)}
                        placeholder="e.g., Barbell Squat"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exerciseForm.newExerciseDescription}
                        onChange={(e) => exerciseForm.setNewExerciseDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={exerciseForm.newExerciseCategory} onValueChange={exerciseForm.setNewExerciseCategory}>
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
                      <Label>Muscle Group</Label>
                      <Select value={exerciseForm.newExerciseMuscleGroup} onValueChange={exerciseForm.setNewExerciseMuscleGroup}>
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
                      <Label>Difficulty</Label>
                      <Select value={exerciseForm.newExerciseDifficulty} onValueChange={exerciseForm.setNewExerciseDifficulty}>
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
                    <Button onClick={handleUpdateExercise} className="w-full" disabled={exerciseForm.submitting}>
                      {exerciseForm.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Update Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Exercise List */}
              {exercises.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading exercises...</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedExercises.map((exercise) => {
                  const Icon = exercise.icon;
                  return (
                    <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-base">{exercise.name}</CardTitle>
                              {exercise.isSystem ? (
                                <span className="text-xs text-muted-foreground">System</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Custom</span>
                              )}
                            </div>
                          </div>
                          {!exercise.isSystem && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditExercise(exercise)}
                                title="Edit exercise"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExercise(exercise.id, exercise.name, exercise.isSystem)}
                                title="Delete exercise"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

                  {/* Load More Button */}
                  {hasMoreExercises && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setDisplayLimit(prev => prev + 15)}
                      >
                        Load More Exercises
                      </Button>
                    </div>
                  )}

                  {filteredExercises.length === 0 && exercises.length > 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No exercises found</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>            {/* TEMPLATES TAB */}
            <TabsContent value="templates" className="space-y-6">
              {/* Show loading state for templates */}
              {templatesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                  </div>
                </div>
              ) : !templatesLoaded ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading templates...</p>
                  </div>
                </div>
              ) : (
                <>
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
                              value={templateForm.newTemplateName}
                              onChange={(e) => templateForm.setNewTemplateName(e.target.value)}
                              placeholder="e.g., Push Day"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={templateForm.newTemplateDescription}
                              onChange={(e) => templateForm.setNewTemplateDescription(e.target.value)}
                              placeholder="Optional notes about this template"
                            />
                          </div>
                          <div>
                            <Label>Select Exercises *</Label>
                            <ExerciseSelector
                              exercises={exercises.map(e => ({ ...e, id: e.id.toString() }))}
                              selectedExercises={templateForm.selectedExercises}
                              onSelect={templateForm.toggleExerciseSelection}
                            />
                          </div>
                          <Button onClick={handleAddTemplate} className="w-full" disabled={templateForm.submitting}>
                            {templateForm.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                              value={templateForm.newTemplateName}
                              onChange={(e) => templateForm.setNewTemplateName(e.target.value)}
                              placeholder="e.g., Push Day"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={templateForm.newTemplateDescription}
                              onChange={(e) => templateForm.setNewTemplateDescription(e.target.value)}
                              placeholder="Optional notes about this template"
                            />
                          </div>
                          <div>
                            <Label>Select Exercises *</Label>
                            <ExerciseSelector
                              exercises={exercises.map(e => ({ ...e, id: e.id.toString() }))}
                              selectedExercises={templateForm.selectedExercises}
                              onSelect={templateForm.toggleExerciseSelection}
                            />
                          </div>
                          <Button onClick={handleUpdateTemplate} className="w-full" disabled={templateForm.submitting}>
                            {templateForm.submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                          <ScrollArea className="h-[280px] mt-2 rounded-md border p-4">
                            <ul className="space-y-2">
                              {viewingTemplate?.exercises.map((ex, idx) => (
                                <li key={idx} className="text-sm flex items-center gap-2">
                                  <span className="text-muted-foreground font-medium">{idx + 1}.</span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
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
                    {templates.slice(0, templateDisplayLimit).map((template) => (
                      <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{template.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {template.exercises.length} exercises • Estimated Time: {template.duration}
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

                  {/* Load More Templates Button */}
                  {templates.length > templateDisplayLimit && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setTemplateDisplayLimit(prev => prev + 15)}
                      >
                        Load More Templates
                      </Button>
                    </div>
                  )}

                  {templates.length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No templates created yet</p>
                        <p className="text-sm text-muted-foreground mt-2">Create your first workout template above</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ExerciseLibrary;
