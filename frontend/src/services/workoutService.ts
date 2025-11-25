import { api } from './api';

export interface WorkoutSession {
    id: number;
    user_id: number;
    name: string | null;
    status: 'active' | 'completed' | 'cancelled';
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    total_volume: number | null;
    total_sets: number | null;
    total_reps: number | null;
    notes: string | null;
    template_id: number | null;
    exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
    id: number;
    workout_session_id: number;
    exercise_id: number;
    position: number;
    notes: string | null;
    exercise: {
        id: number;
        name: string;
        category: string;
        muscle_group: string;
    };
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
    created_at: string;
}

export interface StartWorkoutRequest {
    template_id?: number;
    name?: string;
    notes?: string;
}

export interface AddExerciseRequest {
    exercise_id: number;
    position: number;
    notes?: string;
}

export interface LogSetRequest {
    set_number: number;
    weight?: number;
    reps?: number;
    rpe?: number;
    notes?: string;
    is_warmup?: boolean;
}

export interface UpdateSetRequest {
    weight?: number;
    reps?: number;
    rpe?: number;
    notes?: string;
    is_warmup?: boolean;
}

export const workoutService = {
    // Start a new workout
    startWorkout: async (data: StartWorkoutRequest = {}): Promise<WorkoutSession> => {
        const response = await api.post('/api/workouts/start', data);
        return response.data;
    },

    // Get active workout
    getActiveWorkout: async (): Promise<WorkoutSession | null> => {
        try {
            const response = await api.get('/api/workouts/active');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // Get workout by ID
    getWorkout: async (sessionId: number): Promise<WorkoutSession> => {
        const response = await api.get(`/api/workouts/${sessionId}`);
        return response.data;
    },

    // Get workout history
    getWorkoutHistory: async (limit: number = 50): Promise<WorkoutSession[]> => {
        const response = await api.get('/api/workouts/history', {
            params: { limit },
        });
        return response.data;
    },

    // Add exercise to workout
    addExercise: async (sessionId: number, data: AddExerciseRequest): Promise<WorkoutExercise> => {
        const response = await api.post(`/api/workouts/${sessionId}/exercises`, data);
        return response.data;
    },

    // Remove exercise from workout
    removeExercise: async (workoutExerciseId: number): Promise<void> => {
        await api.delete(`/api/workouts/exercises/${workoutExerciseId}`);
    },

    // Reorder exercises
    reorderExercises: async (sessionId: number, exerciseIds: number[]): Promise<void> => {
        await api.put(`/api/workouts/${sessionId}/exercises/reorder`, {
            exercise_ids: exerciseIds,
        });
    },

    // Log a set
    logSet: async (workoutExerciseId: number, data: LogSetRequest): Promise<WorkoutSet> => {
        const response = await api.post(`/api/workouts/exercises/${workoutExerciseId}/sets`, data);
        return response.data;
    },

    // Update a set
    updateSet: async (setId: number, data: UpdateSetRequest): Promise<WorkoutSet> => {
        const response = await api.put(`/api/workouts/sets/${setId}`, data);
        return response.data;
    },

    // Delete a set
    deleteSet: async (setId: number): Promise<void> => {
        await api.delete(`/api/workouts/sets/${setId}`);
    },

    // Finish workout
    finishWorkout: async (sessionId: number): Promise<WorkoutSession> => {
        const response = await api.post(`/api/workouts/${sessionId}/finish`);
        return response.data;
    },

    // Cancel workout
    cancelWorkout: async (sessionId: number): Promise<void> => {
        await api.delete(`/api/workouts/${sessionId}`);
    },

    // Update workout details
    updateWorkout: async (sessionId: number, data: { name?: string; notes?: string }): Promise<WorkoutSession> => {
        const response = await api.put(`/api/workouts/${sessionId}`, data);
        return response.data;
    },
};
