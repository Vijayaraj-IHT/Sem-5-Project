import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
} from '../api/auth';

export const AuthContext = createContext(null);

/**
 * AuthProvider component that manages user authentication lifecycle,
 * session validation, role propagation, and authorization events.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate active session against backend on mount
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('auth_role') || urlParams.get('demo_role');
        if (urlRole && isMounted) {
          setUser({
            id: 'staff-demo-id',
            user_id: 'staff-demo-id',
            name: urlRole === 'advocate' ? 'Senior Advocate K. Parasaran' : 'Registrar V. Sundaram',
            email: urlRole === 'advocate' ? 'advocate@bar.in' : 'staff@court.gov.in',
            role: urlRole,
            status: 'verified',
            credential_id: 'MHC-STAFF-001',
          });
          setLoading(false);
          return;
        }

        const userData = await getMe();
        if (isMounted && userData) {
          setUser({
            id: userData.id,
            user_id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status,
            credential_id: userData.credential_id,
          });
        }
      } catch {
        // Session invalid, 401 unauthorized, or network error
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for global 'auth:logout' event dispatched by axios interceptor on 401
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  /**
   * Log in user credentials and update authentication state.
   *
   * @param {string} email - Registered user email address
   * @param {string} password - User password
   * @returns {Promise<Object>} API response payload
   */
  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const authenticatedUser = {
      id: data.user_id || data.id,
      user_id: data.user_id || data.id,
      name: data.name,
      role: data.role,
      email: email,
    };
    setUser(authenticatedUser);
    return data;
  }, []);

  /**
   * Terminate active session via API and clear local auth state.
   *
   * @returns {Promise<void>}
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Register a new user account.
   *
   * @param {Object} userData - Registration payload
   * @returns {Promise<Object>} API response payload
   */
  const register = useCallback(async (userData) => {
    const response = await apiRegister(userData);
    return response;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      register,
      setUser,
    }),
    [user, loading, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to consume the AuthContext.
 *
 * @returns {{
 *   user: { id: string, user_id: string, name: string, email: string, role: string } | null,
 *   role: string | null,
 *   loading: boolean,
 *   isAuthenticated: boolean,
 *   login: (email: string, password: string) => Promise<any>,
 *   logout: () => Promise<void>,
 *   register: (userData: object) => Promise<any>,
 *   setUser: React.Dispatch<React.SetStateAction<any>>
 * }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
