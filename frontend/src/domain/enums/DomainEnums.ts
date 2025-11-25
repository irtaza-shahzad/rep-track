/**
 * Domain Enumerations
 * Type-safe enums for domain concepts
 */

export enum WorkoutStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum ExerciseCategory {
    STRENGTH = 'Strength',
    CARDIO = 'Cardio',
    FLEXIBILITY = 'Flexibility',
    MOBILITY = 'Mobility',
    OTHER = 'Other',
}

export enum MuscleGroup {
    CHEST = 'Chest',
    BACK = 'Back',
    LEGS = 'Legs',
    SHOULDERS = 'Shoulders',
    ARMS = 'Arms',
    CORE = 'Core',
    FULL_BODY = 'FullBody',
    OTHER = 'Other',
}

export enum DifficultyLevel {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    ADVANCED = 'Advanced',
}

export enum WeightUnit {
    LBS = 'lbs',
    KG = 'kg',
}

export enum DistanceUnit {
    MILES = 'miles',
    KM = 'km',
}

export enum TimeFormat {
    TWELVE_HOUR = '12h',
    TWENTY_FOUR_HOUR = '24h',
}

export enum ReminderType {
    SCHEDULED = 'Scheduled',
    DAILY_GOAL = 'DailyGoal',
    WEEKLY_TARGET = 'WeeklyTarget',
    STREAK_RISK = 'StreakRisk',
    MILESTONE = 'Milestone',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}
