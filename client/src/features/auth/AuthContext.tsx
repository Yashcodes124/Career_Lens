import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterCredentials, UpdateProfilePayload } from '../../types/auth';
import { loginApi, registerApi, fetchMeApi, updateProfileApi } from '../../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  clearError: () => void;
}

const AUTH_TOKEN_KEY = 'truehire_auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Initialize and verify existing token on app boot
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchMeApi();
        setUser(userData);
      } catch (err: any) {
        console.warn('Failed to hydrate auth user from stored token:', err);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginApi(credentials);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerApi(credentials);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfileApi(payload);
      setUser(updatedUser);
    } catch (err: any) {
      const msg = err.message || 'Failed to update profile.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
