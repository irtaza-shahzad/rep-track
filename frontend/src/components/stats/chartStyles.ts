/**
 * Shared chart styling constants
 * Used across all stats charts for consistency
 */

export const CHART_STYLES = {
    grid: {
        stroke: '#374151',
        strokeDasharray: '3 3',
    },
    axis: {
        stroke: '#9CA3AF',
        tick: { fill: '#9CA3AF', fontSize: 12 },
    },
    tooltip: {
        contentStyle: {
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '14px'
        },
        labelStyle: { color: '#F3F4F6' },
    },
    legend: {
        wrapperStyle: { fontSize: '12px' },
    },
    colors: {
        primary: '#3B82F6',
        accent: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
    },
} as const;

export const CHART_MARGINS = {
    left: 0,
    right: 10,
    top: 5,
    bottom: 5,
};

/**
 * Format date for chart axis based on period
 */
export const formatDateForChart = (value: string, period: 'day' | 'week' | 'month'): string => {
    const date = new Date(value);
    return period === 'month'
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
