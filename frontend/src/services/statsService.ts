import { api } from './api';

export type Summary = {
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    avgWorkoutDurationMin: number;
    bestOneRepMaxByExercise: Record<string, number>;
    muscleGroupBreakdown: Record<string, number>;
    lastUpdatedAt: string;
};

export type TimeseriesPoint = {
    periodStart: string;
    workoutsCompleted: number;
    setsLogged: number;
    repsLogged: number;
    volume: number;
    avgDurationMin: number;
    muscleGroupBreakdown: Record<string, number>;
    bestOneRepMaxByExercise?: Record<string, number>;
};

let _cache: { summary?: Summary } = {};

export const statsService = {
    async getSummary(): Promise<Summary> {
        if (_cache.summary) return _cache.summary;
        const res = await api.get('/api/stats/summary');
        _cache.summary = res.data;
        return res.data;
    },
    async getTimeseries(period: 'day' | 'week' | 'month', from: string, to: string): Promise<TimeseriesPoint[]> {
        const res = await api.get('/api/stats/timeseries', { params: { period, from, to } });
        return res.data;
    },
    invalidate() {
        _cache = {};
    }
};
