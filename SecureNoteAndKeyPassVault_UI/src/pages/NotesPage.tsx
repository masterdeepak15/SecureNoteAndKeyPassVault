import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, SortAsc, FileText, Lock, Loader2, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import { Note, SortOption } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import NoteRichEditor from '@/components/notes/NoteRichEditor';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const maskText = (text: string) => '•'.repeat(Math.min(text.length, 40));

const NotesPage = () => {
  const { isHandshakeComplete } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [editing, setEditing] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [revealedNotes, setRevealedNotes] = useState<Record<string, boolean>>({});

  const fetchNotes = useCallback(async () => {
    if (!isHandshakeComplete) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiService.getAllNotes();
      setNotes(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [isHandshakeComplete]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const toggleReveal = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRevealedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = notes
    .filter(n => {
      if (!search) return true;
      const q = search.toLowerCase();
      // Search on decrypted data always (data is already decrypted in memory)
      return n.title.toLowerCase().includes(q) || n.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sort) {
        case 'recent': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'az': return a.title.localeCompare(b.title);
        case 'za': return b.title.localeCompare(a.title);
      }
    });

  const openNew = () => {
    setEditing({ id: '', title: '', content: '', createdAt: '', updatedAt: '' });
    setIsNew(true);
  };

  const openEdit = (note: Note) => { setEditing({ ...note }); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await apiService.createNote(editing.title, editing.content);
        toast.success('Note created');
      } else {
        await apiService.updateNote(editing.id, editing.title, editing.content);
        toast.success('Note saved');
      }
      await fetchNotes();
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteNote(id);
      toast.success('Note deleted');
      setDeleteConfirm(null);
      if (editing?.id === id) setEditing(null);
      await fetchNotes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <Lock className="w-3.5 h-3.5" /> End-to-end encrypted
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-medium text-sm glow-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
          className="px-4 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{search ? 'No matching notes' : 'No notes yet. Create your first note!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note, i) => {
            const isRevealed = revealedNotes[note.id];
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openEdit(note)}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 cursor-pointer transition-all duration-200 group hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-foreground truncate max-w-[180px]">
                      {isRevealed ? note.title : maskText(note.title)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => toggleReveal(note.id, e)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      title={isRevealed ? 'Hide' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(note.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {isRevealed ? note.content.replace(/<[^>]*>/g, '').substring(0, 150) : maskText(note.content.substring(0, 50))}
                </p>
                <p className="text-xs text-muted-foreground/60">{formatDate(note.updatedAt)}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 text-success" />
                  <span>Encrypted</span>
                </div>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                <input
                  type="text" value={editing.title}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Note title..."
                  className="w-full text-xl font-semibold bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none px-6 pt-6 pb-2"
                />
                <NoteRichEditor
                  content={editing.content}
                  onChange={(html) => setEditing({ ...editing, content: html })}
                />
              </div>
              <div className="flex items-center justify-between p-6 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {editing.createdAt ? `Created ${formatDate(editing.createdAt)}` : 'New note'}
                </span>
                <div className="flex gap-2">
                  {!isNew && (
                    <button onClick={() => setDeleteConfirm(editing.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                      Delete
                    </button>
                  )}
                  <button onClick={save} disabled={saving}
                    className="px-6 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save
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
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Note</h3>
              <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesPage;
