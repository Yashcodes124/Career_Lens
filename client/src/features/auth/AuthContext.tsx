import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfilePayload,
} from "../../types/auth";
import {
  loginApi,
  registerApi,
  fetchMeApi,
  updateProfileApi,
  logoutApi,
} from "../../services/authApi";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "../../lib/api-client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthToken();
      queryClient.clear();
      setUser(null);
      setToken(null);
    };
    window.addEventListener("truehire:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("truehire:unauthorized", onUnauthorized);
  }, [queryClient]);

  // Initialize and verify existing token on app boot
  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchMeApi();
        setUser(userData);
        setToken(getAuthToken());
      } catch (err: unknown) {
        console.warn("Failed to hydrate auth user from stored token:", err);
        clearAuthToken();
        queryClient.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [queryClient]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        queryClient.clear();
        const response = await loginApi(credentials);
        setAuthToken(
          response.token,
          (response as { refreshToken?: string }).refreshToken,
        );
        setToken(response.token);
        setUser(response.user);
      } catch (err: any) {
        const msg =
          err?.message || "Login failed. Please check your credentials.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setIsLoading(true);
      setError(null);
      try {
        queryClient.clear();
        const response = await registerApi(credentials);
        setAuthToken(
          response.token,
          (response as { refreshToken?: string }).refreshToken,
        );
        setToken(response.token);
        setUser(response.user);
      } catch (err: any) {
        const msg = err?.message || "Registration failed. Please try again.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await logoutApi();
      }
    } catch {
      // Proceed with local cleanup even if token already expired or network failed
    } finally {
      clearAuthToken();
      queryClient.clear();
      setToken(null);
      setUser(null);
      setError(null);
    }
  }, [queryClient]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await updateProfileApi(payload);
      setUser(updatedUser);
    } catch (err: any) {
      const msg = err?.message || "Failed to update profile.";
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
