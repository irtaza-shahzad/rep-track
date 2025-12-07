/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * Prevents text overflow in UI cards
 */
export function formatLargeNumber(num: number): string {
    if (num === 0) return '0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1_000_000_000) {
        // Billions
        return sign + (absNum / 1_000_000_000).toFixed(1) + 'B';
    } else if (absNum >= 1_000_000) {
        // Millions
        return sign + (absNum / 1_000_000).toFixed(1) + 'M';
    } else if (absNum >= 10_000) {
        // Thousands (only for numbers >= 10K to avoid showing 5.2K for small values)
        return sign + (absNum / 1_000).toFixed(1) + 'K';
    } else {
        // Small numbers - show with commas
        return sign + absNum.toLocaleString();
    }
}

/**
 * Format weight with appropriate units
 * Shows compact format for very large weights
 */
export function formatWeight(weight: number, unit: 'kg' | 'lbs'): string {
    const formatted = formatLargeNumber(Math.round(weight));
    return `${formatted} ${unit}`;
}
