/**
 * Domain Model - Exercise Entity
 * Represents an exercise in the system
 */

import { ExerciseCategory, MuscleGroup, DifficultyLevel } from '../enums/DomainEnums';

export interface ExerciseDTO {
    id: number;
    name: string;
    category: string;
    muscle_group: string;
    difficulty?: string;
    instructions?: string;
    is_system: boolean;
    user_id?: number;
    created_at: string;
}

export interface IExercise {
    getId(): number;
    getName(): string;
    getCategory(): ExerciseCategory;
    getMuscleGroup(): MuscleGroup;
    getDifficulty(): DifficultyLevel | null;
    getInstructions(): string | null;
    isSystemExercise(): boolean;
    getUserId(): number | null;
    toJSON(): ExerciseDTO;
}

/**
 * Exercise Entity
 * Immutable domain object
 */
export class Exercise implements IExercise {
    private constructor(
        private readonly id: number,
        private readonly name: string,
        private readonly category: ExerciseCategory,
        private readonly muscleGroup: MuscleGroup,
        private readonly difficulty: DifficultyLevel | null,
        private readonly instructions: string | null,
        private readonly isSystem: boolean,
        private readonly userId: number | null,
        private readonly createdAt: Date
    ) { }

    /**
     * Factory method from DTO
     */
    static fromDTO(dto: ExerciseDTO): Exercise {
        return new Exercise(
            dto.id,
            dto.name,
            dto.category as ExerciseCategory,
            dto.muscle_group as MuscleGroup,
            dto.difficulty ? (dto.difficulty as DifficultyLevel) : null,
            dto.instructions || null,
            dto.is_system,
            dto.user_id || null,
            new Date(dto.created_at)
        );
    }

    /**
     * Create new exercise data
     */
    static create(
        name: string,
        category: ExerciseCategory,
        muscleGroup: MuscleGroup,
        difficulty?: DifficultyLevel,
        instructions?: string
    ): {
        name: string;
        category: ExerciseCategory;
        muscleGroup: MuscleGroup;
        difficulty: DifficultyLevel | null;
        instructions: string | null;
        isSystem: boolean;
        createdAt: Date;
    } {
        return {
            name,
            category,
            muscleGroup,
            difficulty: difficulty || null,
            instructions: instructions || null,
            isSystem: false,
            createdAt: new Date(),
        };
    }

    // Getters
    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getCategory(): ExerciseCategory {
        return this.category;
    }

    getMuscleGroup(): MuscleGroup {
        return this.muscleGroup;
    }

    getDifficulty(): DifficultyLevel | null {
        return this.difficulty;
    }

    getInstructions(): string | null {
        return this.instructions;
    }

    isSystemExercise(): boolean {
        return this.isSystem;
    }

    getUserId(): number | null {
        return this.userId;
    }

    getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    toJSON(): ExerciseDTO {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            muscle_group: this.muscleGroup,
            difficulty: this.difficulty || undefined,
            instructions: this.instructions || undefined,
            is_system: this.isSystem,
            user_id: this.userId || undefined,
            created_at: this.createdAt.toISOString(),
        };
    }

    equals(other: Exercise): boolean {
        return this.id === other.id;
    }
}
