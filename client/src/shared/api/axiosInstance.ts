import axios from 'axios';
import { getApiUrl } from '@/shared/config/env';

const STORAGE_ACCESS_KEY = 'auth_access_token';
const STORAGE_REFRESH_KEY = 'auth_refresh_token';

/**
 * RSK-001 / T-044: Shared Axios instance with sliding-window token renewal.
 * All authenticated API calls should use this instance so the interceptor
 * can transparently refresh the access token on HTTP 401.
 */
const axiosInstance = axios.create({
  baseURL: getApiUrl(),
});

// Attach the stored access token on every outgoing request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Queue of callers waiting for the in-flight refresh to complete
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

/**
 * Wires the 401-intercept logic into axiosInstance.
 * Must be called once from AuthProvider so the `logout` callback is in scope.
 */
export const setupAxiosInterceptors = (logout: () => void): void => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }

      // If another refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(STORAGE_REFRESH_KEY);

      if (!refreshToken) {
        isRefreshing = false;
        logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${getApiUrl()}/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data.tokens;

        localStorage.setItem(STORAGE_ACCESS_KEY, accessToken);
        localStorage.setItem(STORAGE_REFRESH_KEY, newRefreshToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        flushQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        flushQueue(refreshError);
        localStorage.removeItem(STORAGE_ACCESS_KEY);
        localStorage.removeItem(STORAGE_REFRESH_KEY);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
};

export default axiosInstance;
