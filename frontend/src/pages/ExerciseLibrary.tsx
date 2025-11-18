import { useState } from 'react';
import { Search, Dumbbell, Heart, TrendingUp, Plus, Play, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Exercise {
  id: string;
  name: string;
  category: string;
  icon: any;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: string[];
  duration: string;
}

const ExerciseLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const { toast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: 'Bench Press', category: 'Chest', icon: Dumbbell },
    { id: '2', name: 'Squat', category: 'Legs', icon: TrendingUp },
    { id: '3', name: 'Deadlift', category: 'Back', icon: TrendingUp },
    { id: '4', name: 'Overhead Press', category: 'Shoulders', icon: Dumbbell },
    { id: '5', name: 'Pull-ups', category: 'Back', icon: Heart },
    { id: '6', name: 'Rows', category: 'Back', icon: Dumbbell },
    { id: '7', name: 'Bicep Curls', category: 'Arms', icon: Dumbbell },
    { id: '8', name: 'Tricep Extensions', category: 'Arms', icon: Dumbbell },
    { id: '9', name: 'Leg Press', category: 'Legs', icon: TrendingUp },
    { id: '10', name: 'Lunges', category: 'Legs', icon: TrendingUp },
    { id: '11', name: 'Lat Pulldown', category: 'Back', icon: Heart },
    { id: '12', name: 'Chest Fly', category: 'Chest', icon: Dumbbell },
  ]);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([
    { id: '1', name: 'Push Day', exercises: ['Bench Press', 'Overhead Press', 'Tricep Extensions'], duration: '45 min' },
    { id: '2', name: 'Pull Day', exercises: ['Deadlift', 'Pull-ups', 'Rows', 'Bicep Curls'], duration: '60 min' },
    { id: '3', name: 'Leg Day', exercises: ['Squat', 'Leg Press', 'Lunges'], duration: '50 min' },
  ]);

  const categories = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExercise = () => {
    if (!newExerciseName.trim() || !newExerciseCategory) {
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
      icon: Dumbbell,
    };

    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
    setNewExerciseCategory('');
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
    };

    setTemplates([...templates, newTemplate]);
    setNewTemplateName('');
    setSelectedExercises([]);
    setIsAddTemplateOpen(false);
    
    toast({
      title: "Template Created",
      description: `${newTemplateName} has been saved`,
    });
  };

  const handleStartWorkout = (templateName: string) => {
    toast({
      title: "Starting Workout",
      description: `${templateName} workout started`,
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Template Deleted",
      description: `${name} has been removed`,
    });
  };

  const toggleExerciseSelection = (exerciseName: string) => {
    if (selectedExercises.includes(exerciseName)) {
      setSelectedExercises(selectedExercises.filter(e => e !== exerciseName));
    } else {
      setSelectedExercises([...selectedExercises, exerciseName]);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:pl-72 md:p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Exercises</h1>
          <p className="text-muted-foreground">Manage exercises and workout templates</p>
        </div>

        <Tabs defaultValue="exercises" className="animate-slide-up">
          <TabsList className="mb-6 w-full grid grid-cols-2">
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Exercises Tab */}
          <TabsContent value="exercises">
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
                    <Button onClick={handleAddExercise} className="w-full">
                      Add Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <p className="text-sm text-muted-foreground">{exercise.category}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
              <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Workout Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
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
                      <Label>Select Exercises</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                        {exercises.map((exercise) => (
                          <label
                            key={exercise.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedExercises.includes(exercise.name)}
                              onChange={() => toggleExerciseSelection(exercise.name)}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-sm">{exercise.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedExercises.length} exercise(s) selected
                      </p>
                    </div>
                    <Button onClick={handleAddTemplate} className="w-full">
                      Create Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="card-elevated">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-1">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{template.duration}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        {template.exercises.map((ex, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <Dumbbell className="h-3 w-3" />
                            {ex}
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleStartWorkout(template.name)}
                        className="w-full rounded-xl"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Workout
                      </Button>
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
    </Layout>
  );
};

export default ExerciseLibrary;
