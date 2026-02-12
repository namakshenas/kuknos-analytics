import axios from 'axios';

/**
 * Axios client instance configured for the Kuknos Analytics API
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30s timeout for VPN latency
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor for error handling
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;
