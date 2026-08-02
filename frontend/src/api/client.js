import axios from 'axios';

/**
 * Axios client instance configured for the Kuknos Analytics API
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor for error handling.
 *
 * Cancellations are skipped: filter changes deliberately abort the requests
 * they supersede, and logging those as errors buried the real failures.
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isCancel(error)) {
      // `detail` is the FastAPI error field; falling back to the raw body
      // logged "[object Object]" and hid the actual message.
      const detail = error?.response?.data?.detail;
      const status = error?.response?.status;
      console.error(
        `API Error${status ? ` ${status}` : ''}: ${detail || error.message}`,
        error?.config?.url ?? ''
      );
    }
    return Promise.reject(error);
  }
);

export default client;
