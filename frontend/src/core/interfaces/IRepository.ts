/**
 * Repository Interfaces
 * Following Repository Pattern and Dependency Inversion Principle
 * 
 * These are abstractions - concrete implementations are in infrastructure layer
 */

import { User, UserDTO } from '../../domain/models/User';
import { Exercise, ExerciseDTO } from '../../domain/models/Exercise';

/**
 * Generic Repository Interface
 * Following Interface Segregation Principle - base contract
 */
export interface IRepository<T, TDTO> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<TDTO>): Promise<T>;
  update(id: number, data: Partial<TDTO>): Promise<T>;
  delete(id: number): Promise<void>;
}

/**
 * User Repository Interface
 * Extends base repository with user-specific methods
 */
export interface IUserRepository extends IRepository<User, UserDTO> {
  findByEmail(email: string): Promise<User | null>;
  getCurrentUser(): User | null;
  setCurrentUser(user: User): void;
  clearCurrentUser(): void;
}

/**
 * Exercise Repository Interface
 */
export interface IExerciseRepository extends IRepository<Exercise, ExerciseDTO> {
  findByCategory(category: string): Promise<Exercise[]>;
  findByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  findSystemExercises(): Promise<Exercise[]>;
  findUserExercises(userId: number): Promise<Exercise[]>;
  search(query: string): Promise<Exercise[]>;
}

/**
 * Workout Repository Interface
 * Workout-specific operations
 */
export interface IWorkoutRepository {
  startWorkout(data: StartWorkoutData): Promise<WorkoutSession>;
  getActiveWorkout(): Promise<WorkoutSession | null>;
  getWorkoutById(id: number): Promise<WorkoutSession>;
  getWorkoutHistory(limit?: number): Promise<WorkoutSession[]>;
  finishWorkout(id: number): Promise<WorkoutSession>;
  cancelWorkout(id: number): Promise<void>;
  updateWorkout(id: number, data: UpdateWorkoutData): Promise<WorkoutSession>;
  
  // Exercise operations within workout
  addExercise(sessionId: number, data: AddExerciseData): Promise<WorkoutExercise>;
  removeExercise(workoutExerciseId: number): Promise<void>;
  reorderExercises(sessionId: number, exerciseIds: number[]): Promise<void>;
  
  // Set operations
  logSet(workoutExerciseId: number, data: LogSetData): Promise<WorkoutSet>;
  updateSet(setId: number, data: UpdateSetData): Promise<WorkoutSet>;
  deleteSet(setId: number): Promise<void>;
}

/**
 * Template Repository Interface
 */
export interface ITemplateRepository {
  findById(id: number): Promise<WorkoutTemplate | null>;
  findAll(): Promise<WorkoutTemplate[]>;
  findUserTemplates(userId: number): Promise<WorkoutTemplate[]>;
  create(data: CreateTemplateData): Promise<WorkoutTemplate>;
  update(id: number, data: UpdateTemplateData): Promise<WorkoutTemplate>;
  delete(id: number): Promise<void>;
  addExercise(templateId: number, exerciseId: number, position: number): Promise<void>;
  removeExercise(templateId: number, exerciseId: number): Promise<void>;
}

/**
 * Data Transfer Types for Repositories
 */
export interface StartWorkoutData {
  template_id?: number;
  name?: string;
  notes?: string;
}

export interface UpdateWorkoutData {
  name?: string;
  notes?: string;
}

export interface AddExerciseData {
  exercise_id: number;
  position: number;
  notes?: string;
}

export interface LogSetData {
  set_number: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  notes?: string;
  is_warmup?: boolean;
}

export interface UpdateSetData {
  weight?: number;
  reps?: number;
  rpe?: number;
  notes?: string;
  is_warmup?: boolean;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  exercise_ids: number[];
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
}

// Placeholder types - will be replaced with proper domain models
export interface WorkoutSession {
  id: number;
  user_id: number;
  name: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: number;
  workout_session_id: number;
  exercise_id: number;
  position: number;
  notes: string | null;
  exercise: ExerciseDTO;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
  is_warmup: boolean;
}

export interface WorkoutTemplate {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  exercises: any[];
}
