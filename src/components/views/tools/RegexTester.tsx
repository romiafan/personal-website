"use client";
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface MatchInfo {
  index: number;
  text: string;
  groups: string[];
}

// Throttle hook (simple trailing throttle)
function useThrottle<T>(value: T, delay: number) {
  const [throttled, setThrottled] = useState(value);
  const last = useRef<number>(Date.now());
  useEffect(() => {
    const now = Date.now();
    const remaining = delay - (now - last.current);
    if (remaining <= 0) {
      last.current = now;
      setThrottled(value);
    } else {
      const id = setTimeout(() => {
        last.current = Date.now();
        setThrottled(value);
      }, remaining);
      return () => clearTimeout(id);
    }
  }, [value, delay]);
  return throttled;
}

export function RegexTester() {
  const { push } = useToast();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog.');
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const throttledInputs = useThrottle({ pattern, flags, text }, 150);

  useEffect(() => {
    const { pattern: p, flags: f, text: t } = throttledInputs;
    const run = () => {
      if (!p) {
        setError(null);
        setMatches([]);
        return;
      }
      try {
        if (/[^gimsuyd]/.test(f)) {
          setError('Invalid flags (allowed: g i m s u y d)');
          setMatches([]);
          return;
        }
        if (t.length > 200_000) {
          setError('Input too large (>200k chars)');
          setMatches([]);
          return;
        }
        const re = new RegExp(p, f || '');
        const results: MatchInfo[] = [];
        if (re.global || re.sticky) {
          let m: RegExpExecArray | null; let loopGuard = 0;
          while ((m = re.exec(t)) !== null) {
            results.push({ index: m.index, text: m[0], groups: m.slice(1) });
            if (m[0] === '') re.lastIndex++;
            if (++loopGuard > 10_000) {
              setError('Too many matches (>10k) – aborted');
              break;
            }
          }
        } else {
          const m = re.exec(t);
          if (m) results.push({ index: m.index, text: m[0], groups: m.slice(1) });
        }
        setError(prev => (prev && prev.startsWith('Too many')) ? prev : null);
        setMatches(results);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Invalid pattern';
        setError(msg);
        setMatches([]);
      }
    };
    run();
  }, [throttledInputs]);

  function copyPattern() {
    if (!pattern) return;
    navigator.clipboard.writeText(`/${pattern}/${flags}`);
    push({ title: 'Copied', description: 'Pattern copied', variant: 'success' });
  }

  // Highlight matches by splitting text – for performance we only do if < 20k chars
  function renderHighlighted() {
    if (!pattern || error || text.length > 20_000) {
      return <pre className="whitespace-pre-wrap break-words font-mono text-xs">{text}</pre>;
    }
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const parts: React.ReactNode[] = [];
      let lastIndex = 0; let m: RegExpExecArray | null; let key = 0;
      while ((m = re.exec(text)) !== null) {
        const start = m.index; const end = start + m[0].length;
        if (start > lastIndex) parts.push(<span key={key++}>{text.slice(lastIndex, start)}</span>);
        parts.push(
          <mark key={key++} className="bg-primary/30 rounded px-0.5">
            {m[0] === '' ? '∅' : m[0]}
          </mark>
        );
        lastIndex = end;
        if (m[0] === '') re.lastIndex++;
        if (key > 5000) { // safety cutoff
          parts.push(<span key={key++}>…</span>);
          break;
        }
      }
      if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
      return <pre className="whitespace-pre-wrap break-words font-mono text-xs">{parts}</pre>;
    } catch {
      return <pre className="whitespace-pre-wrap break-words font-mono text-xs">{text}</pre>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Regex Tester</h2>
        <div className="flex gap-2">
          <button
            onClick={copyPattern}
            disabled={!pattern}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            type="button"
          >Copy</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <label className="text-sm space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Pattern</span>
          <input
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="e.g. (fox|dog)"
            className="h-9 w-56 rounded-md border bg-background px-2 text-sm font-mono outline-none focus-visible:ring focus-visible:ring-primary/30"
          />
        </label>
        <label className="text-sm space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Flags (g i m s u y d)</span>
          <input
            value={flags}
            onChange={e => setFlags(e.target.value)}
            className="h-9 w-32 rounded-md border bg-background px-2 text-sm font-mono outline-none focus-visible:ring focus-visible:ring-primary/30"
          />
        </label>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Test Text</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full h-40 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
        />
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Matches: {matches.length}</span>
          {text.length > 20_000 && <span className="text-muted-foreground">(highlight disabled for large input)</span>}
        </div>
        <div className="rounded-md border bg-muted/40 p-2 max-h-56 overflow-auto">
          {renderHighlighted()}
        </div>
      </div>
      {matches.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Groups</h3>
          <div className="rounded-md border bg-background max-h-40 overflow-auto divide-y">
            {matches.slice(0, 1000).map((m, i) => (
              <div key={i} className="p-1 text-[10px] flex flex-wrap gap-2">
                <span className="font-mono px-1 rounded bg-muted">@{m.index}</span>
                <span className="font-mono">{m.text || '∅'}</span>
                {m.groups.map((g, gi) => (
                  <span key={gi} className="font-mono px-1 rounded bg-primary/20">[{gi + 1}] {g ?? '∅'}</span>
                ))}
              </div>
            ))}
            {matches.length > 1000 && <div className="p-1 text-[10px] text-muted-foreground">… truncated</div>}
          </div>
        </div>
      )}
    </div>
  );
}
