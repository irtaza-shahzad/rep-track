import { api } from './api';

// Types matching backend schemas
export type Category = 'Strength' | 'Cardio' | 'Flexibility' | 'Mobility' | 'Other';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Full Body' | 'Other';

export interface Exercise {
    id: number;
    name: string;
    description?: string;
    category: Category;
    difficulty: Difficulty;
    muscle_group: MuscleGroup;
    user_id?: number;
    created_at?: string;
}

export interface ExerciseCreate {
    name: string;
    description?: string;
    category: Category;
    difficulty: Difficulty;
    muscle_group: MuscleGroup;
}

export interface ExerciseUpdate {
    name?: string;
    description?: string;
    category?: Category;
    difficulty?: Difficulty;
    muscle_group?: MuscleGroup;
}

export interface APIResponse<T> {
    status: string;
    message: string;
    data: T;
}

export const exerciseService = {
    /**
     * Get all exercises (global + user-specific)
     * Backend automatically filters based on JWT token
     */
    getAllExercises: async (): Promise<Exercise[]> => {
        const response = await api.get<APIResponse<Exercise[]>>('/api/exercises/');
        return response.data.data;
    },

    /**
     * Get a specific exercise by ID
     */
    getExerciseById: async (exerciseId: number): Promise<Exercise> => {
        const response = await api.get<APIResponse<Exercise>>(`/api/exercises/${exerciseId}`);
        return response.data.data;
    },

    /**
     * Search exercises by name (partial or full match)
     */
    searchExercisesByName: async (name: string): Promise<Exercise[]> => {
        const response = await api.get<APIResponse<Exercise[]>>(`/api/exercises/by-name/${name}`);
        return response.data.data;
    },

    /**
     * Get exercises by category
     */
    getExercisesByCategory: async (category: Category): Promise<Exercise[]> => {
        const response = await api.get<APIResponse<Exercise[]>>(`/api/exercises/by-category/${category}`);
        return response.data.data;
    },

    /**
     * Create a new exercise (user-specific)
     * Backend automatically links to current user via JWT
     */
    createExercise: async (exercise: ExerciseCreate): Promise<Exercise> => {
        const response = await api.post<APIResponse<Exercise>>('/api/exercises/', exercise);
        return response.data.data;
    },

    /**
     * Update an existing exercise (only if user owns it)
     */
    updateExercise: async (exerciseId: number, exercise: ExerciseUpdate): Promise<Exercise> => {
        const response = await api.put<APIResponse<Exercise>>(`/api/exercises/${exerciseId}`, exercise);
        return response.data.data;
    },

    /**
     * Delete an exercise (only if user owns it)
     */
    deleteExercise: async (exerciseId: number): Promise<void> => {
        await api.delete(`/api/exercises/${exerciseId}`);
    },
};
