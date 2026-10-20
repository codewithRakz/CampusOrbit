import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type UserResponse, authStorage, fetchCurrentUser } from '../services/auth';

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const savedToken = authStorage.getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await fetchCurrentUser(savedToken);
      setUser(userData);
      setToken(savedToken);
    } catch {
      // If token is expired or invalid on the backend, clear local storage
      authStorage.removeToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (newToken: string): Promise<UserResponse> => {
    authStorage.setToken(newToken);
    setToken(newToken);
    try {
      const userData = await fetchCurrentUser(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      authStorage.removeToken();
      setToken(null);
      setUser(null);
      throw err;
    }
  };

  const logout = () => {
    authStorage.removeToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const savedToken = authStorage.getToken();
    if (savedToken) {
      try {
        const userData = await fetchCurrentUser(savedToken);
        setUser(userData);
      } catch {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
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
