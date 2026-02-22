import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { secureClient } from '@/services/secureNotesClient';
import { useAuth } from '@/context/AuthContext';

export interface UserSession {
  sessionId: string;
  ipAddress: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  location: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}

interface SessionContextType {
  sessions: UserSession[];
  isLoading: boolean;
  currentSessionId: string | null;
  fetchSessions: () => Promise<void>;
  logoutSession: (sessionId: string) => Promise<void>;
  logoutOtherSessions: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isHandshakeComplete, logout } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const currentSessionId = secureClient.userSessionId;

  // Heartbeat every 3 minutes
  useEffect(() => {
    if (!isAuthenticated || !isHandshakeComplete) return;

    const doHeartbeat = async () => {
      try {
        const result = await secureClient.sendHeartbeat();
        if (!result.isValid) {
          console.warn('Session expired via heartbeat');
          logout();
        }
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    // Immediate heartbeat
    doHeartbeat();
    heartbeatRef.current = setInterval(doHeartbeat, 3 * 60 * 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isAuthenticated, isHandshakeComplete, logout]);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await secureClient.getActiveSessions();
      setSessions(data.activeSessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logoutSession = useCallback(async (sessionId: string) => {
    await secureClient.revokeSession(sessionId);
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  }, []);

  const logoutOtherSessions = useCallback(async () => {
    await secureClient.revokeOtherSessions();
    setSessions(prev => prev.filter(s => s.isCurrentSession));
  }, []);

  const logoutAllSessions = useCallback(async () => {
    await secureClient.revokeAllSessions();
    setSessions([]);
    logout();
  }, [logout]);

  return (
    <SessionContext.Provider value={{ sessions, isLoading, currentSessionId, fetchSessions, logoutSession, logoutOtherSessions, logoutAllSessions }}>
      {children}
    </SessionContext.Provider>
  );
};