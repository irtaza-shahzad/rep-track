const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getAuthToken = () => {
  const user = localStorage.getItem('fittrack_user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token;
  }
  return null;
};

export const exportData = async (
  format: 'csv' | 'pdf',
  include: string[] = ['all'],
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const params = new URLSearchParams();
  params.append('format', format);
  include.forEach(item => params.append('include', item));
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(`${API_BASE_URL}/export/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Export failed with status ${response.status}`);
  }

  return await response.blob();
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
