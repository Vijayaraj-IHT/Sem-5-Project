import axios from 'axios';

/**
 * Extracts the value of a specific cookie by name from document.cookie.
 *
 * @param {string} name - The cookie name to retrieve.
 * @returns {string|null} - The decoded cookie value or null if not found.
 */
export function getCookie(name) {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

/**
 * Pre-configured Axios instance for the Lexguard API.
 * Uses HttpOnly cookie authentication and automatic CSRF header injection.
 */
const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: Inject X-CSRF-Token header on state-modifying requests
client.interceptors.request.use(
  (config) => {
    const method = (config.method || '').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = getCookie('lexguard_csrf_token');
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: On 401 Unauthorized, notify application and redirect
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear cached user credentials from local storage
      try {
        localStorage.removeItem('lexguard_user');
        sessionStorage.removeItem('lexguard_user');
      } catch (_) {
        // Suppress storage access errors in restricted sandbox environments
      }

      const requestUrl = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/auth/login');

      // Dispatch global auth:logout event for AuthContext & UI listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: {
              reason: 'Session expired or unauthorized',
              url: requestUrl,
            },
          })
        );

        // Redirect to /login if not already on the login route and not an active login attempt
        if (!isLoginRequest && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
