// frontend/src/services/liveWorkoutService.ts
/**
 * Live Workout API Service
 * Handles communication with the new live workout endpoints
 */

import { api } from './api';

export interface WorkoutSet {
    reps: string;          // number-like string
    weight: string;        // number-like string
    rpe?: number;          // 1–10, optional
    completed?: boolean;   // set when user marks done
    isWarmup?: boolean;    // optional flag
    isDropset?: boolean;   // optional flag
    isFailure?: boolean;   // optional flag
}

export interface Exercise {
    id: string;            // local identifier
    name: string;          // exercise name
    sets: WorkoutSet[];
}

export interface WorkoutState {
    id: number;            // database ID
    exercises: Exercise[];
    elapsedSeconds: number;   // total duration in seconds
    isPaused: boolean;
    workoutNumber: number;    // sequential count per user
    workoutName: string;      // optional display name
    startTime: number;        // epoch ms timestamp
}

export interface StartWorkoutRequest {
    template_id?: number;   // optional template to start from
    workout_name?: string;  // optional name
}

export interface UpdateWorkoutRequest {
    workout_name?: string;
    is_paused?: boolean;
}

export interface FinishWorkoutResponse {
    id: number;
    workout_number: number;
    workout_name: string;
    start_time: number;
    elapsed_seconds: number;
    total_exercises: number;
    total_sets: number;
    message: string;
}

export interface ExerciseCreateRequest {
    exercise_id: number;
    position?: number;
}

export interface SetCreateRequest {
    reps?: string;
    weight?: string;
    rpe?: number;
    completed?: boolean;
    isWarmup?: boolean;
    isDropset?: boolean;
    isFailure?: boolean;
}

const BASE_URL = '/api/live-workout';

/**
 * Start a new workout session
 */
export async function startWorkout(data: StartWorkoutRequest): Promise<WorkoutState> {
    const response = await api.post(`${BASE_URL}/start`, data);
    return response.data.data;
}

/**
 * Get the currently active workout
 */
export async function getActiveWorkout(): Promise<WorkoutState | null> {
    const response = await api.get(`${BASE_URL}/active`);
    return response.data.data;
}

/**
 * Get a specific workout by ID
 */
export async function getWorkoutById(workoutId: number): Promise<WorkoutState> {
    const response = await api.get(`${BASE_URL}/${workoutId}`);
    return response.data.data;
}

/**
 * Update workout metadata
 */
export async function updateWorkout(
    workoutId: number,
    data: UpdateWorkoutRequest
): Promise<WorkoutState> {
    const response = await api.put(`${BASE_URL}/${workoutId}`, data);
    return response.data.data;
}

/**
 * Finish an active workout
 */
export async function finishWorkout(workoutId: number): Promise<FinishWorkoutResponse> {
    const response = await api.post(`${BASE_URL}/${workoutId}/finish`);
    return response.data.data;
}

/**
 * Cancel/delete an active workout
 */
export async function cancelWorkout(workoutId: number): Promise<void> {
    await api.delete(`${BASE_URL}/${workoutId}`);
}

/**
 * Add an exercise to the workout
 */
export async function addExercise(
    workoutId: number,
    data: ExerciseCreateRequest
): Promise<Exercise> {
    const response = await api.post(`${BASE_URL}/${workoutId}/exercises`, data);
    return response.data.data;
}

/**
 * Remove an exercise from the workout
 */
export async function removeExercise(workoutExerciseId: number): Promise<void> {
    await api.delete(`${BASE_URL}/exercises/${workoutExerciseId}`);
}

/**
 * Reorder exercises in the workout
 */
export async function reorderExercises(
    workoutId: number,
    exerciseIds: number[]
): Promise<WorkoutState> {
    const response = await api.put(`${BASE_URL}/${workoutId}/exercises/reorder`, exerciseIds);
    return response.data.data;
}

/**
 * Add a set to an exercise
 */
export async function addSet(
    workoutExerciseId: number,
    data: SetCreateRequest
): Promise<WorkoutSet> {
    const response = await api.post(`${BASE_URL}/exercises/${workoutExerciseId}/sets`, data);
    return response.data.data;
}

/**
 * Update a set
 */
export async function updateSet(
    setId: number,
    data: SetCreateRequest
): Promise<WorkoutSet> {
    const response = await api.put(`${BASE_URL}/sets/${setId}`, data);
    return response.data.data;
}

/**
 * Remove a set
 */
export async function removeSet(setId: number): Promise<void> {
    await api.delete(`${BASE_URL}/sets/${setId}`);
}