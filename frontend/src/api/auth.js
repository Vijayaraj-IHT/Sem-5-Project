import client from './client';

/**
 * Authenticate user with email and password credentials.
 * Sets HttpOnly access token and client-accessible CSRF cookies on success.
 *
 * @param {string} email - Registered user email address
 * @param {string} password - User plaintext password
 * @returns {Promise<Object>} Token response containing { access_token, token_type, role, user_id, name, csrf_token }
 */
export async function login(email, password) {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
}

/**
 * Register a new user account with role-specific verification status.
 *
 * @param {Object} userData - Registration payload { name, email, password, role, credential_id? }
 * @returns {Promise<Object>} Created user profile data
 */
export async function register(userData) {
  const response = await client.post('/auth/register', userData);
  return response.data;
}

/**
 * Log out the current user session.
 * Clears HttpOnly authentication cookies and logs the audit event.
 *
 * @returns {Promise<Object>} Status response { status: "success", message: "..." }
 */
export async function logout() {
  const response = await client.post('/auth/logout');
  return response.data;
}

/**
 * Retrieve the current authenticated user's profile details.
 *
 * @returns {Promise<Object>} User profile object { id, email, name, role, status, ... }
 */
export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data;
}

export default {
  login,
  register,
  logout,
  getMe,
};
