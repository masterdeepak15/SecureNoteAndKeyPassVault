import { useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet, MapPin, Clock, Timer, Trash2, Shield, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useSession, UserSession } from '@/context/SessionContext';
import { formatRelativeTime, formatTimeUntil, formatDateTime } from '@/lib/timeUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const DeviceIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'Mobile': return <Smartphone className={className} />;
    case 'Tablet': return <Tablet className={className} />;
    default: return <Monitor className={className} />;
  }
};

const SessionCard = ({ session, onLogout }: { session: UserSession; onLogout: (id: string) => void }) => {
  const isExpired = new Date(session.expiresAt).getTime() < Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-card border p-5 transition-all duration-200 hover:shadow-lg ${
        session.isCurrentSession ? 'border-primary/40 ring-1 ring-primary/20' : isExpired ? 'border-destructive/30' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            session.isCurrentSession ? 'bg-primary/10' : isExpired ? 'bg-destructive/10' : 'bg-muted'
          }`}>
            <DeviceIcon type={session.deviceType} className={`w-5 h-5 ${
              session.isCurrentSession ? 'text-primary' : isExpired ? 'text-destructive' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{session.operatingSystem}</h3>
              {session.isCurrentSession && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0">You</Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{session.browser} • {session.deviceType}</p>

            <div className="mt-2.5 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" /> IP: {session.ipAddress}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" /> Last active: {formatRelativeTime(session.lastActivityAt)}
              </p>
              <p className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 shrink-0" /> {isExpired ? 'Expired' : `Expires in: ${formatTimeUntil(session.expiresAt)}`}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/60">Created: {formatDateTime(session.createdAt)}</p>
          </div>
        </div>

        {!session.isCurrentSession && (
          <button
            onClick={() => onLogout(session.sessionId)}
            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            title="Logout this device"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const SessionsPage = () => {
  const { sessions, isLoading, fetchSessions, logoutSession, logoutOtherSessions, logoutAllSessions } = useSession();
  const [confirmAction, setConfirmAction] = useState<'single' | 'others' | 'all' | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const otherCount = sessions.filter(s => !s.isCurrentSession).length;

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      if (confirmAction === 'single' && targetSessionId) {
        await logoutSession(targetSessionId);
        toast.success('Device logged out');
      } else if (confirmAction === 'others') {
        await logoutOtherSessions();
        toast.success(`Logged out from ${otherCount} other device(s)`);
      } else if (confirmAction === 'all') {
        await logoutAllSessions();
        toast.success('Logged out from all devices');
        return; // Will redirect via auth context
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
      setTargetSessionId(null);
    }
  };

  const openSingleLogout = (sessionId: string) => {
    setTargetSessionId(sessionId);
    setConfirmAction('single');
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isCurrentSession) return -1;
    if (b.isCurrentSession) return 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all devices where you're currently logged in.
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && sessions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl bg-card border border-border p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                  <div className="h-3 w-40 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </p>
          {sortedSessions.map(session => (
            <SessionCard key={session.sessionId} session={session} onLogout={openSingleLogout} />
          ))}
        </div>
      )}

      {/* Security Actions */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-warning/30 bg-warning/5 p-6 space-y-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Security Actions</h2>
          </div>

          {otherCount > 0 && (
            <button
              onClick={() => setConfirmAction('others')}
              className="block w-full text-left px-4 py-3 rounded-lg border border-warning/20 text-foreground text-sm font-medium hover:bg-warning/10 transition-colors"
            >
              <span className="font-semibold">Logout from All Other Devices</span>
              <p className="text-xs text-muted-foreground mt-0.5">Keeps this device logged in, logs out {otherCount} other{otherCount !== 1 ? 's' : ''}</p>
            </button>
          )}

          <button
            onClick={() => setConfirmAction('all')}
            className="block w-full text-left px-4 py-3 rounded-lg border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            <span className="font-semibold">Logout from All Devices</span>
            <p className="text-xs text-muted-foreground mt-0.5">Logs out everywhere including this device. You'll need to login again.</p>
          </button>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => !actionLoading && setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {confirmAction === 'single' ? 'Logout from this device?' :
                 confirmAction === 'others' ? 'Logout from all other devices?' :
                 'Logout from ALL devices?'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {confirmAction === 'single' ? 'This will end the session on that device.' :
                 confirmAction === 'others' ? `This will end ${otherCount} other session(s). Your current session stays active.` :
                 'This will end ALL sessions including this one. You will need to login again.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionsPage;
