import React, { createContext, useState, useEffect, useCallback } from "react";
// Commented out to fix the "api is defined but never used" ESLint error.
// Uncomment this when you are ready to make the '/auth/me' request.
// import api from '../services/api';

// Silence Vite's Fast Refresh warning for exporting non-components in Context files
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]
   = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Moved ABOVE the useEffect and wrapped in useCallback so it can be
  // safely called inside the loadUser try/catch block without throwing errors.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  // Load user details if a token exists on initial load
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Replace with your actual user details endpoint if available.
          // Otherwise, parse the user from local storage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            // In a complete implementation, fetch from: `/auth/me` or similar
            // const response = await api.get('/auth/me');
            // setUser(response.data.user);
          }
        } catch (error) {
          console.error("Failed to load user session", error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
