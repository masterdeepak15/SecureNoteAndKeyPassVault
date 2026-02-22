import { useState, useCallback } from 'react';
import { Check, Copy, RefreshCw, X } from 'lucide-react';

interface Props {
  onUse: (password: string) => void;
  onClose: () => void;
}

const PasswordGenerator = ({ onUse, onClose }: Props) => {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    let pw = '';
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) pw += chars[arr[i] % chars.length];
    return pw;
  }, [length, upper, lower, numbers, symbols]);

  const [password, setPassword] = useState(() => generate());

  const regenerate = () => setPassword(generate());

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = (() => {
    let s = 0;
    if (length >= 12) s++;
    if (length >= 16) s++;
    if (upper && lower) s++;
    if (numbers) s++;
    if (symbols) s++;
    if (s <= 2) return { label: 'Weak', color: 'bg-destructive' };
    if (s <= 3) return { label: 'Medium', color: 'bg-warning' };
    return { label: 'Strong', color: 'bg-success' };
  })();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Generate Password</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-surface border border-border">
          <code className="flex-1 text-sm font-mono text-foreground break-all select-all">{password}</code>
          <button onClick={copy} className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0">
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%' }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Length</label>
              <span className="text-sm font-mono text-muted-foreground">{length}</span>
            </div>
            <input type="range" min={8} max={32} value={length} onChange={e => { setLength(+e.target.value); }} onMouseUp={regenerate} onTouchEnd={regenerate} className="w-full accent-primary" />
          </div>

          {[
            { label: 'Uppercase (A-Z)', checked: upper, set: setUpper },
            { label: 'Lowercase (a-z)', checked: lower, set: setLower },
            { label: 'Numbers (0-9)', checked: numbers, set: setNumbers },
            { label: 'Symbols (!@#$%)', checked: symbols, set: setSymbols },
          ].map(opt => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={opt.checked} onChange={e => { opt.set(e.target.checked); setTimeout(regenerate, 0); }} className="w-4 h-4 rounded border-border accent-primary" />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={regenerate} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
          <button onClick={() => onUse(password)} className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
            Use This Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
