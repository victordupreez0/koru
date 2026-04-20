import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// Auth context – provides user session state and login/logout helpers across the app
const AuthContext = createContext(null);

const STORAGE_KEY = "learnonline.auth";

// Read a saved session from localStorage on initial load
function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

// AuthProvider – wraps the app tree and makes auth state available to all children
export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  // Persist the authenticated user and update React state
  const login = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  // Clear the session and redirect to the landing page
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Convenience booleans so components don't need to inspect role strings
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook – gives any component quick access to the auth state
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
