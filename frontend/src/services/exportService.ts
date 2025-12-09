import { api } from './api';

interface ExportRequest {
    format: 'csv' | 'pdf';
    time_range: string;
}

export const exportService = {
    /**
     * Export workout data in CSV or PDF format
     * Downloads file directly to browser
     */
    async exportWorkoutData(format: 'csv' | 'pdf', timeRange: string): Promise<void> {
        const request: ExportRequest = {
            format,
            time_range: timeRange
        };

        const response = await api.post('/api/export/workout-data', request, {
            responseType: 'blob', // Important for file downloads
        });

        // Get the blob from response
        const blob = response.data;

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        const filename = `workout_data_${timeRange}_${date}.${format}`;
        link.setAttribute('download', filename);

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
