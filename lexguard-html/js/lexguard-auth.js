/**
 * LexGuard — Authentication & Session Management (lexguard-auth.js)
 * Semester 5 Project · LexGuard Judicial Repository & Verification Platform
 */

(function (window) {
  'use strict';

  window.LG = window.LG || {};

  LG.session = {
    /**
     * Retrieve current session object from storage.
     */
    get: function () {
      try {
        const raw = localStorage.getItem(LG.config.SESSION_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse session storage:', e);
        return null;
      }
    },

    /**
     * Save session object.
     */
    set: function (sessionData) {
      if (!sessionData) return;
      try {
        localStorage.setItem(LG.config.SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        if (sessionData.csrf_token) {
          LG._csrf = sessionData.csrf_token;
        }
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    },

    /**
     * Clear session storage.
     */
    clear: function () {
      localStorage.removeItem(LG.config.SESSION_STORAGE_KEY);
      LG._csrf = null;
    },

    /**
     * Get active JWT access token.
     */
    token: function () {
      const s = LG.session.get();
      return s ? s.access_token : null;
    },

    /**
     * Get active user info object.
     */
    user: function () {
      const s = LG.session.get();
      if (!s) return null;
      return {
        id: s.user_id,
        name: s.name || 'User',
        email: s.email || '',
        role: s.role || 'public'
      };
    },

    /**
     * Check if user is authenticated with a non-empty token.
     */
    isAuthenticated: function () {
      return !!LG.session.token();
    },

    /**
     * Check if user has one of the specified roles.
     */
    hasRole: function (roles) {
      const user = LG.session.user();
      if (!user) return false;
      if (!Array.isArray(roles)) roles = [roles];
      // Normalize role names (staff, court_staff, senior_staff)
      const userRole = user.role.toLowerCase();
      return roles.some(function (r) {
        const target = r.toLowerCase();
        if ((target === 'staff' || target === 'court_staff') && (userRole === 'staff' || userRole === 'court_staff' || userRole === 'senior_staff')) {
          return true;
        }
        return userRole === target;
      });
    }
  };

  /**
   * Route Guard: Check authentication and role permissions.
   * Redirects to login or unauthorized page if check fails.
   */
  LG.requireAuth = function (allowedRoles) {
    if (!LG.session.isAuthenticated()) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = 'login.html?redirect=' + redirectUrl;
      return false;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      if (!LG.session.hasRole(allowedRoles)) {
        window.location.href = 'unauthorized.html';
        return false;
      }
    }

    return true;
  };

})(window);
