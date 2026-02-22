import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Lock, Loader2, Globe, Copy, Eye, EyeOff, Trash2, ExternalLink, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { PasswordEntry, SortOption } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordGenerator from '@/components/passwords/PasswordGenerator';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'recent', label: 'Recent' },
  { value: 'oldest', label: 'Oldest' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const maskText = (text: string, len = 12) => '•'.repeat(len);

const emptyEntry = (): Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  siteName: '', username: '', password: '', url: '', serverIp: null, hostname: null, notes: null,
});

const PasswordsPage = () => {
  const { isHandshakeComplete } = useAuth();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('az');
  const [editing, setEditing] = useState<(PasswordEntry & { isNew?: boolean }) | null>(null);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showEditorPw, setShowEditorPw] = useState(false);

  const fetchPasswords = useCallback(async () => {
    if (!isHandshakeComplete) { setLoading(false); return; }
    try { setPasswords(await apiService.getAllPasswords()); }
    catch (err: any) { toast.error(err.message || 'Failed to load passwords'); }
    finally { setLoading(false); }
  }, [isHandshakeComplete]);

  useEffect(() => { fetchPasswords(); }, [fetchPasswords]);

  // Auto-hide revealed cards after 30s
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    Object.keys(revealedCards).forEach(id => {
      if (revealedCards[id]) {
        timers.push(setTimeout(() => setRevealedCards(p => ({ ...p, [id]: false })), 30000));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [revealedCards]);

  const toggleReveal = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRevealedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = passwords
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      // Search on decrypted data always (data is already decrypted in memory)
      return p.siteName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q) || p.url.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sort) {
        case 'az': return a.siteName.localeCompare(b.siteName);
        case 'za': return b.siteName.localeCompare(a.siteName);
        case 'recent': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
    });

  const copyPassword = (pw: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(pw);
    toast.success('Password copied!');
  };

  const openNew = () => {
    const e = emptyEntry();
    setEditing({ ...e, id: '', createdAt: '', updatedAt: '', isNew: true });
    setShowAdvanced(false);
    setShowEditorPw(false);
  };

  const openEdit = (entry: PasswordEntry) => {
    setEditing({ ...entry, isNew: false });
    setShowAdvanced(!!(entry.serverIp || entry.hostname || entry.notes));
    setShowEditorPw(false);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.siteName.trim() || !editing.username.trim() || !editing.password.trim()) {
      toast.error('Site name, username, and password are required'); return;
    }
    setSaving(true);
    try {
      const { id, createdAt, updatedAt, isNew, ...data } = editing;
      if (isNew) {
        await apiService.createPassword(data);
        toast.success('Password saved');
      } else {
        await apiService.updatePassword(id, data);
        toast.success('Password updated');
      }
      await fetchPasswords();
      setEditing(null);
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deletePassword(id);
      toast.success('Password deleted');
      setDeleteConfirm(null);
      if (editing?.id === id) setEditing(null);
      await fetchPasswords();
    } catch (err: any) { toast.error(err.message || 'Failed to delete'); }
  };

  if (!isHandshakeComplete) {
    return (
      <div className="text-center py-20">
        <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Please log in again to establish a secure session.</p>
        <p className="text-xs text-muted-foreground/60 mt-2">RSA handshake is required for encryption/decryption</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Passwords</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Lock className="w-3.5 h-3.5" /> End-to-end encrypted
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm glow-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Password
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search passwords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{search ? 'No matching passwords' : 'No passwords saved. Add your first password!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => {
            const isRevealed = revealedCards[entry.id];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                onClick={() => openEdit(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {isRevealed ? entry.siteName : maskText(entry.siteName, 10)}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {isRevealed ? entry.username : maskText(entry.username, 15)}
                      </p>
                      <p className="text-xs text-muted-foreground/60 truncate">
                        {isRevealed ? entry.url : maskText(entry.url, 20)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => toggleReveal(entry.id, e)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={isRevealed ? 'Hide' : 'Reveal'}>
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => copyPassword(entry.password, e)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy password">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirm(entry.id); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isRevealed && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <code className="text-sm font-mono text-foreground">{entry.password}</code>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground/60 mt-2">Updated {formatDate(entry.updatedAt)}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setEditing(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">{editing.isNew ? 'Add Password' : 'Edit Password'}</h3>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {[
                  { label: 'Site Name *', key: 'siteName' as const, placeholder: 'e.g. GitHub' },
                  { label: 'Username *', key: 'username' as const, placeholder: 'e.g. john@example.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                    <input type="text" value={(editing as any)[f.key] || ''} onChange={e => setEditing({ ...editing, [f.key]: e.target.value })}
                      placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={showEditorPw ? 'text' : 'password'} value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })}
                        placeholder="••••••••" className="w-full px-4 pr-10 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
                      <button type="button" onClick={() => setShowEditorPw(!showEditorPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showEditorPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={() => setShowGenerator(true)} className="px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors shrink-0" title="Generate">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">URL</label>
                  <div className="relative">
                    <input type="url" value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })}
                      placeholder="https://example.com" className="w-full px-4 pr-10 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
                    {editing.url && (
                      <a href={editing.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pt-2">
                    {[
                      { label: 'Server IP', key: 'serverIp' as const, placeholder: 'e.g. 192.168.1.1' },
                      { label: 'Hostname', key: 'hostname' as const, placeholder: 'e.g. prod-server-01' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                        <input type="text" value={(editing as any)[f.key] || ''} onChange={e => setEditing({ ...editing, [f.key]: e.target.value || null })}
                          placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                      <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value || null })}
                        rows={3} placeholder="Additional notes..." className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-none" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-6 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {editing.createdAt ? `Created ${formatDate(editing.createdAt)}` : 'New entry'}
                </span>
                <div className="flex gap-2">
                  {!editing.isNew && (
                    <button onClick={() => setDeleteConfirm(editing.id)} className="px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">Delete</button>
                  )}
                  <button onClick={save} disabled={saving} className="px-6 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Password</h3>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Generator */}
      {showGenerator && (
        <PasswordGenerator
          onUse={pw => { if (editing) setEditing({ ...editing, password: pw }); setShowGenerator(false); }}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
};

export default PasswordsPage;
