"use client";
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface OutputRow {
  label: string;
  value: string;
  key: string;
}

type Parsed = { date: Date; sourceType: 'unix-seconds' | 'unix-millis' | 'iso' | 'auto-now' } | { error: string };

function detectAndParse(input: string): Parsed {
  const trimmed = input.trim();
  if (!trimmed) return { date: new Date(), sourceType: 'auto-now' };
  // Numeric? detect seconds vs millis
  if (/^-?\d+$/.test(trimmed)) {
    try {
      if (trimmed.length <= 10) { // treat as seconds
        const sec = parseInt(trimmed, 10);
        if (isNaN(sec)) return { error: 'Invalid numeric epoch' };
        return { date: new Date(sec * 1000), sourceType: 'unix-seconds' };
      } else {
        const ms = parseInt(trimmed, 10);
        if (isNaN(ms)) return { error: 'Invalid numeric epoch' };
        return { date: new Date(ms), sourceType: 'unix-millis' };
      }
    } catch {
      return { error: 'Failed to parse epoch value' };
    }
  }
  // Try ISO / Date parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return { date: d, sourceType: 'iso' };
  }
  return { error: 'Unrecognized format (expect ISO, epoch seconds, or epoch ms)' };
}

function relativeFrom(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [1000, 's'],
    [60 * 1000, 'm'],
    [60 * 60 * 1000, 'h'],
    [24 * 60 * 60 * 1000, 'd'],
    [7 * 24 * 60 * 60 * 1000, 'w'],
  ];
  let chosen = '0s';
  for (let i = units.length - 1; i >= 0; i--) {
    const [ms, label] = units[i];
    if (abs >= ms) {
      const val = Math.floor(abs / ms);
      chosen = `${val}${label}`;
      break;
    }
  }
  return diff === 0 ? 'now' : diff < 0 ? `${chosen} ago` : `in ${chosen}`;
}

export function TimestampConverter() {
  const { push } = useToast();
  const [raw, setRaw] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [parsed, setParsed] = useState<Parsed>({ date: new Date(), sourceType: 'auto-now' });
  const intervalRef = useRef<number | null>(null);

  // Parse when input changes
  useEffect(() => {
    setParsed(detectAndParse(raw));
  }, [raw]);

  // Auto refresh (updates only if empty or auto-now) every 1s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        setParsed(prev => {
          if ('error' in prev) return prev; // do nothing on error state
            if (raw.trim()) return detectAndParse(raw); // respect user input
          return { date: new Date(), sourceType: 'auto-now' };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, raw]);

  function snapNow() {
    setParsed({ date: new Date(), sourceType: 'auto-now' });
    push({ title: 'Updated', description: 'Captured current time', variant: 'success' });
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    push({ title: 'Copied', description: `${label} copied`, variant: 'success' });
  }

  const rows: OutputRow[] = (() => {
    if ('error' in parsed) return [];
    const d = parsed.date;
    const iso = d.toISOString();
    const utc = d.toUTCString();
    const local = d.toLocaleString();
    const unixMs = d.getTime();
    const unixS = Math.floor(unixMs / 1000);
    const rel = relativeFrom(d);
    return [
      { label: 'ISO 8601', value: iso, key: 'iso' },
      { label: 'UTC', value: utc, key: 'utc' },
      { label: 'Local', value: local, key: 'local' },
      { label: 'UNIX (s)', value: String(unixS), key: 'unixs' },
      { label: 'UNIX (ms)', value: String(unixMs), key: 'unixms' },
      { label: 'Relative', value: rel, key: 'relative' },
    ];
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Timestamp Converter</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={snapNow}
            className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            type="button"
          >Now</button>
          <label className="flex items-center gap-1 text-xs font-medium select-none">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> auto
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <input
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="Enter epoch (s or ms) or ISO string — blank = now"
          className="w-full h-10 rounded-md border bg-background px-3 text-sm font-mono outline-none focus-visible:ring focus-visible:ring-primary/30"
          aria-label="Timestamp input"
        />
        {('error' in parsed) && (
          <p className="text-xs text-red-600 dark:text-red-400">{parsed.error}</p>
        )}
        {!('error' in parsed) && (
          <p className="text-[10px] text-muted-foreground">Source: {parsed.sourceType}</p>
        )}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && ('error' in parsed) && (
          <p className="text-xs text-muted-foreground">No outputs.</p>
        )}
        {rows.map(r => (
          <div key={r.key} className="group flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</span>
              <span className="font-mono truncate" title={r.value}>{r.value}</span>
            </div>
            <button
              onClick={() => copy(r.value, r.label)}
              className="underline text-[10px] opacity-0 group-hover:opacity-100 transition"
              type="button"
            >copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}
