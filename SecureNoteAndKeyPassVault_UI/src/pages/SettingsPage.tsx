import { useAuth } from '@/context/AuthContext';
import { User, Shield, Database, AlertTriangle, Lock, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteType, setDeleteType] = useState<string | null>(null);

  const handleDanger = (type: string) => {
    toast.success(`${type} action simulated (mock mode)`);
    setDeleteType(null);
  };

  const sections = [
    {
      title: 'Account',
      icon: User,
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground font-medium">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Login Method</span><span className="text-foreground font-medium capitalize">{user?.loginMethod}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Member Since</span><span className="text-foreground font-medium">{user?.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'N/A'}</span></div>
        </div>
      ),
    },
    {
      title: 'Security',
      icon: Shield,
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <span className="flex items-center gap-1.5 text-success text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-success" /> Active
            </span>
          </div>
          <button
            onClick={() => navigate('/sessions')}
            className="mt-2 w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            <span className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Manage Sessions</span>
            <span className="text-xs text-muted-foreground">→</span>
          </button>
        </div>
      ),
    },
    {
      title: 'Data',
      icon: Database,
      content: (
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="text-foreground font-medium">6</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Passwords</span><span className="text-foreground font-medium">5</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="text-foreground font-medium">~12 KB</span></div>
          <button className="mt-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
            Export All Data
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <Lock className="w-3.5 h-3.5" /> Your data is encrypted and secure
        </p>
      </div>

      {sections.map((s, i) => (
        <motion.div
          key={s.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl bg-card border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <s.icon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
          </div>
          {s.content}
        </motion.div>
      ))}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
        </div>
        <div className="space-y-3">
          {['Delete All Notes', 'Delete All Passwords', 'Delete Account'].map(action => (
            <button
              key={action}
              onClick={() => setDeleteType(action)}
              className="block w-full text-left px-4 py-2.5 rounded-lg border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Confirm */}
      {deleteType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setDeleteType(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">{deleteType}</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteType(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => { handleDanger(deleteType); if (deleteType === 'Delete Account') logout(); }} className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
