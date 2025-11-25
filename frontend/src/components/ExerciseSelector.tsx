import { useState } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: string;
}

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercises: string[];
  onSelect: (exerciseName: string) => void;
  multiSelect?: boolean;
  showSelectedCount?: boolean;
}

const ExerciseSelector = ({ 
  exercises, 
  selectedExercises, 
  onSelect,
  multiSelect = true,
  showSelectedCount = true 
}: ExerciseSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const categories = ['Strength', 'Cardio', 'Flexibility', 'Mobility'];
  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
    const matchesDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesMuscleGroup && matchesDifficulty;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMuscleGroup('all');
    setSelectedDifficulty('all');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>

      {/* Clear Filters */}
      {(searchQuery || selectedCategory !== 'all' || selectedMuscleGroup !== 'all' || selectedDifficulty !== 'all') && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="w-full">
          Clear Filters
        </Button>
      )}

      {/* Results Count and Selected Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredExercises.length} exercises found</span>
        {showSelectedCount && (
          <span className="font-medium text-primary">
            {selectedExercises.length} selected
          </span>
        )}
      </div>

      {/* Exercise List */}
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-3 space-y-2">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No exercises found matching your filters
            </div>
          ) : (
            filteredExercises.map((exercise) => {
              const isSelected = selectedExercises.includes(exercise.name);
              return (
                <div
                  key={exercise.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'hover:bg-muted border-2 border-transparent'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(exercise.name);
                  }}
                >
                  {multiSelect && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 accent-primary pointer-events-none"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate">{exercise.name}</span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {exercise.muscleGroup}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        exercise.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-600' :
                        exercise.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ExerciseSelector;
