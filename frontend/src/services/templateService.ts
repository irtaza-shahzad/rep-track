import { api } from './api';

// Types matching backend schemas
export interface TemplateExercise {
    id?: number;
    exercise_id?: number;
    exercise_name: string;
    position?: number;
    sets?: number;
    reps?: number;
    duration_seconds?: number;
    rest_seconds?: number;
    notes?: string;
}

export interface WorkoutTemplate {
    id?: number;
    name: string;
    description?: string;
    owner_id?: number;
    created_at?: string;
    updated_at?: string;
    template_exercises?: TemplateExercise[];
}

export interface WorkoutTemplateCreate {
    name: string;
    description?: string;
    exercises?: TemplateExercise[];
}

export interface WorkoutTemplateUpdate {
    name?: string;
    description?: string;
    exercises?: TemplateExercise[];
}

export const templateService = {
    /**
     * Get all templates for the current user
     * Backend automatically filters by owner_id from JWT token
     */
    getAllTemplates: async (): Promise<WorkoutTemplate[]> => {
        const response = await api.get<WorkoutTemplate[]>('/templates/');
        return response.data;
    },

    /**
     * Get a specific template by ID
     * Only returns if user owns the template
     */
    getTemplateById: async (templateId: number): Promise<WorkoutTemplate> => {
        const response = await api.get<WorkoutTemplate>(`/templates/${templateId}`);
        return response.data;
    },

    /**
     * Create a new workout template
     * Backend automatically assigns current user as owner
     */
    createTemplate: async (template: WorkoutTemplateCreate): Promise<WorkoutTemplate> => {
        const response = await api.post<WorkoutTemplate>('/templates/', template);
        return response.data;
    },

    /**
     * Update an existing template
     * Only works if user owns the template
     */
    updateTemplate: async (templateId: number, template: WorkoutTemplateUpdate): Promise<WorkoutTemplate> => {
        const response = await api.put<WorkoutTemplate>(`/templates/${templateId}`, template);
        return response.data;
    },

    /**
     * Delete a template
     * Only works if user owns the template
     */
    deleteTemplate: async (templateId: number): Promise<void> => {
        await api.delete(`/templates/${templateId}`);
    },
};
