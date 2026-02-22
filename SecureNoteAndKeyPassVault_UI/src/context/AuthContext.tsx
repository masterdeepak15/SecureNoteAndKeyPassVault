import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@/types';
import { secureClient } from '@/services/secureNotesClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHandshakeComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHandshakeComplete, setIsHandshakeComplete] = useState(false);

  // Restore session on mount and auto-handshake if token exists
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const saved = localStorage.getItem('securenotes_user');
      const token = localStorage.getItem('securenotes_token');
      const userSessionId = localStorage.getItem('securenotes_user_session_id');
      if (saved && token) {
        setUser(JSON.parse(saved));
        secureClient.authToken = token;
        if (userSessionId) secureClient.userSessionId = userSessionId;
        setUser(JSON.parse(saved));
        secureClient.authToken = token;

        // Auto re-establish handshake on refresh
        try {
          await secureClient.performHandshake();
          if (isMounted) setIsHandshakeComplete(true);
          console.log('✓ Auto-handshake restored on refresh');
        } catch (err) {
          console.warn('Auto-handshake failed, user needs to re-login:', err);
          // Clear stale session
          if (isMounted) {
            setUser(null);
            localStorage.removeItem('securenotes_user');
            localStorage.removeItem('securenotes_token');
            secureClient.logout();
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };

    initializeAuth();

    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await secureClient.login(email, password);

    // Auto-perform handshake if server provides handshake data
    if (data.handshake) {
      await secureClient.performHandshake(data.handshake);
      setIsHandshakeComplete(true);
    }

    const u: User = { email: data.email, loginMethod: 'email', memberSince: new Date().toISOString() };
    setUser(u);
    localStorage.setItem('securenotes_user', JSON.stringify(u));
    localStorage.setItem('securenotes_token', data.token);
    if (data.sessionId) localStorage.setItem('securenotes_user_session_id', data.sessionId);
  }, []);

  const register = useCallback(async (email: string, password: string, confirmPassword: string) => {
    await secureClient.register(email, password, confirmPassword);
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const data = await secureClient.googleLogin(idToken);

    // Auto-perform handshake if server provides handshake data
    if (data.handshake) {
      await secureClient.performHandshake(data.handshake);
      setIsHandshakeComplete(true);
    }

    const u: User = { email: data.email, name: data.name, loginMethod: 'google', memberSince: new Date().toISOString() };
    setUser(u);
    localStorage.setItem('securenotes_user', JSON.stringify(u));
    localStorage.setItem('securenotes_token', data.token);
    if (data.sessionId) localStorage.setItem('securenotes_user_session_id', data.sessionId);
  }, []);

  const logout = useCallback(() => {
    secureClient.logout();
    setUser(null);
    setIsHandshakeComplete(false);
    localStorage.removeItem('securenotes_user');
    localStorage.removeItem('securenotes_token');
    localStorage.removeItem('securenotes_user_session_id');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isHandshakeComplete, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};