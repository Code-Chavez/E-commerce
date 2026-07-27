export const getApiUrl = () => {
  // Use the environment variable configured in Vite
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return apiUrl;
};
