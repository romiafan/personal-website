"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface ParseResult {
  raw: string;
  formatted: string;
  error?: string;
  parsed?: unknown;
}

function jsonToCsv(json: unknown): { csv: string; rows: number } {
  if (!Array.isArray(json)) {
    throw new Error('Root JSON must be an array of objects for Excel export');
  }
  if (json.length === 0) return { csv: '', rows: 0 };
  const objects = json as Record<string, unknown>[];
  const headers = Array.from(
    objects.reduce<Set<string>>((acc, obj) => {
      Object.keys(obj).forEach(k => acc.add(k));
      return acc;
    }, new Set())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(',')];
  for (const obj of objects) {
    lines.push(headers.map(h => escape(obj[h])).join(','));
  }
  return { csv: lines.join('\n'), rows: objects.length };
}

export function JsonTools() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<'text' | 'tree' | 'table'>('text');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [matchPaths, setMatchPaths] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'plain' | 'regex'>('plain');
  const [depthLimit, setDepthLimit] = useState<number | null>(null);
  const [perfMode, setPerfMode] = useState<boolean>(false);
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');
  // History (undo/redo) for parsed JSON transformations
  const [history, setHistory] = useState<ParseResult[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  function pushHistory(entry: ParseResult) {
    setHistory(prev => {
      const capped = prev.slice(0, historyIndex + 1); // drop any forward history
      capped.push(entry);
      // limit to last 50 states
      const trimmed = capped.slice(-50);
      setHistoryIndex(trimmed.length - 1);
      return trimmed;
    });
  }


  const undo = useCallback(() => {
    setHistoryIndex(i => {
      if (i <= 0) return i;
      const nextIndex = i - 1;
      const restored = history[nextIndex];
      setResult(restored);
      // recompute node count for restored state
      if (restored.parsed) {
        let count = 0; const walk = (v: unknown) => { count++; if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(walk); else Object.values(v as Record<string, unknown>).forEach(walk);} }; walk(restored.parsed);
        setNodeCount(count);
      }
      return nextIndex;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIndex(i => {
      if (i < 0 || i >= history.length - 1) return i;
      const nextIndex = i + 1;
      const restored = history[nextIndex];
      setResult(restored);
      if (restored.parsed) {
        let count = 0; const walk = (v: unknown) => { count++; if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(walk); else Object.values(v as Record<string, unknown>).forEach(walk);} }; walk(restored.parsed);
        setNodeCount(count);
      }
      return nextIndex;
    });
  }, [history]);
  // Load persisted preferences once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jsonToolsPrefs');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<{ mode: typeof mode; sortKeys: boolean; search: string; searchMode: 'plain' | 'regex'; depthLimit: number | null; perfMode: boolean }>;
        if (parsed.mode === 'text' || parsed.mode === 'tree' || parsed.mode === 'table') setMode(parsed.mode);
        if (typeof parsed.sortKeys === 'boolean') setSortKeys(parsed.sortKeys);
        if (typeof parsed.search === 'string') setSearch(parsed.search);
        if (parsed.searchMode === 'plain' || parsed.searchMode === 'regex') setSearchMode(parsed.searchMode);
        if (parsed.depthLimit === null || typeof parsed.depthLimit === 'number') setDepthLimit(parsed.depthLimit ?? null);
        if (typeof parsed.perfMode === 'boolean') setPerfMode(parsed.perfMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      const payload = JSON.stringify({ mode, sortKeys, search, searchMode, depthLimit, perfMode });
      localStorage.setItem('jsonToolsPrefs', payload);
    } catch {
      // ignore
    }
  }, [mode, sortKeys, search, searchMode, depthLimit, perfMode]);
  const { push } = useToast();
  const [nodeCount, setNodeCount] = useState<number>(0);
  const LARGE_THRESHOLD = 10000; // heuristic

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          // redo
          if (!isTyping) {
            e.preventDefault();
            redo();
          }
        } else {
          // undo
            if (!isTyping) {
              e.preventDefault();
              undo();
            }
        }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  function formatJson() {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({ raw: input, formatted, parsed });
      pushHistory({ raw: input, formatted, parsed });
      // count nodes for performance guard
      let count = 0;
      const walk = (v: unknown) => {
        count++;
        if (v && typeof v === 'object') {
          if (Array.isArray(v)) v.forEach(walk); else Object.values(v as Record<string, unknown>).forEach(walk);
        }
      };
      walk(parsed);
      setNodeCount(count);
      push({ title: 'Formatted', description: 'JSON formatted successfully', variant: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown parse error';
      setResult({ raw: input, formatted: '', error: message });
      push({ title: 'Parse Error', description: message, variant: 'error' });
    }
  }

  function copyFormatted() {
    if (!result?.formatted) return;
    navigator.clipboard.writeText(result.formatted);
    push({ title: 'Copied', description: 'Formatted JSON copied to clipboard', variant: 'success' });
  }

  function exportCsv() {
    try {
      const parsed = JSON.parse(input);
      const { csv, rows } = jsonToCsv(parsed);
      if (!csv) {
        push({ title: 'No Data', description: 'Array is empty; nothing to export', variant: 'error' });
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      URL.revokeObjectURL(url);
      push({ title: 'Exported', description: `Exported ${rows} rows to CSV`, variant: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown export error';
      push({ title: 'Export Failed', description: message, variant: 'error' });
    }
  }

  function minifyJson() {
    try {
      const parsed = result?.parsed ?? JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setResult(prev => prev ? { ...prev, formatted: minified, raw: prev.raw } : { raw: input, formatted: minified, parsed });
      pushHistory({ raw: result?.raw ?? input, formatted: minified, parsed });
      push({ title: 'Minified', description: 'JSON minified (whitespace removed)', variant: 'success' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Minify failed';
      push({ title: 'Minify Error', description: message, variant: 'error' });
    }
  }

  function downloadJson() {
    if (!result?.formatted) return;
    const blob = new Blob([result.formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
    push({ title: 'Download', description: 'JSON file downloaded', variant: 'success' });
  }

  // Tree helpers
  function toggle(path: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }
  function collapseAll() {
    if (!result?.parsed) return;
    // naive approach: just expand everything first by clearing, then add all composite paths
    const all = new Set<string>();
    const walk = (v: unknown, path: string) => {
      if (v && typeof v === 'object') {
        all.add(path);
        if (Array.isArray(v)) {
          v.forEach((item, i) => walk(item, path ? `${path}.${i}` : String(i)));
        } else {
          Object.entries(v as Record<string, unknown>).forEach(([k, val]) => walk(val, path ? `${path}.${k}` : k));
        }
      }
    };
    walk(result.parsed, 'root');
    setCollapsed(all);
  }
  function expandAll() {
    setCollapsed(new Set());
  }

  function collapseToDepth(limit: number) {
    if (!result?.parsed) return;
    if (limit < 0) { setCollapsed(new Set()); return; }
    const coll = new Set<string>();
    const walk = (v: unknown, path: string, depth: number) => {
      if (v && typeof v === 'object') {
        if (depth >= limit) {
          coll.add(path);
          return; // don't recurse deeper
        }
        if (Array.isArray(v)) {
          v.forEach((item, i) => walk(item, path ? `${path}.${i}` : String(i), depth + 1));
        } else {
          Object.entries(v as Record<string, unknown>).forEach(([k, val]) => walk(val, path ? `${path}.${k}` : k, depth + 1));
        }
      }
    };
    walk(result.parsed, 'root', 0);
    setCollapsed(coll);
  }

  function renderNode(value: unknown, path: string, keyName?: string, depth = 0): React.ReactNode {
    // Performance mode truncation: limit number of rendered composite nodes
    // We'll track via a closure counter.
    const isArr = Array.isArray(value);
    const isObj = !!value && typeof value === 'object' && !isArr;
    const composite = isObj || isArr;
    const displayKey = keyName !== undefined ? <span className="text-sky-600 dark:text-sky-400">{keyName}</span> : null;
    const indent = { paddingLeft: depth * 12 } as const;
    const isMatch = matchPaths.includes(path);
    const isSelected = selectedPath === path;
    const baseClasses = `leading-5 ${isMatch ? 'bg-yellow-300/30 dark:bg-yellow-600/20' : ''} ${isSelected ? 'ring-1 ring-primary/60 rounded-sm' : ''}`;

    if (!composite) {
      let display: string;
      if (typeof value === 'string') display = '"' + value + '"';
      else if (value === null) display = 'null';
      else display = String(value);
      const isEditing = editPath === path;
      return (
        <div
          key={path}
          style={indent}
          className={baseClasses + ' cursor-pointer'}
          onClick={() => setSelectedPath(path)}
          onDoubleClick={() => {
            if (typeof value !== 'object') {
              setEditPath(path);
              // store raw without added quotes for strings
              if (typeof value === 'string') setEditValue(value);
              else if (value === null) setEditValue('null');
              else setEditValue(String(value));
            }
          }}
        >
          {displayKey && <>{displayKey}: </>}
          {!isEditing && <span className="text-foreground">{display}</span>}
          {isEditing && (
            <span className="inline-flex items-center gap-1">
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="border rounded px-1 py-0.5 text-[11px] bg-background w-40"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') applyEdit();
                  if (e.key === 'Escape') { setEditPath(null); setEditValue(''); }
                }}
              />
              <button onClick={applyEdit} className="rounded border px-1 py-0.5 text-[10px]">Save</button>
              <button onClick={() => { setEditPath(null); setEditValue(''); }} className="rounded border px-1 py-0.5 text-[10px]">Cancel</button>
            </span>
          )}
        </div>
      );
    }

    const collapsedHere = collapsed.has(path);
    const size = isArr ? (value as unknown[]).length : Object.keys(value as object).length;

    let childEntries: [string, unknown][] = [];
    if (isObj) {
      childEntries = Object.entries(value as Record<string, unknown>);
      if (sortKeys) childEntries = [...childEntries].sort((a,b)=> a[0].localeCompare(b[0]));
    }

    return (
      <div key={path} style={indent} className={baseClasses + ' cursor-pointer'} onClick={() => setSelectedPath(path)}>
        <button
          onClick={(e) => { e.stopPropagation(); toggle(path); }}
          className="mr-1 inline-flex items-center justify-center w-4 text-xs select-none"
          aria-label={collapsedHere ? 'Expand node' : 'Collapse node'}
        >
          {collapsedHere ? '+' : '-'}
        </button>
        {displayKey && <>{displayKey}: </>}
        <span className="text-purple-600 dark:text-purple-400">{isArr ? `Array(${size})` : 'Object'}</span>
        {!collapsedHere && (
          <div className="mt-1">
            {isArr && (value as unknown[]).map((v, i) => (
              <div key={path + '.' + i}>{renderNode(v, path + '.' + i, String(i), depth + 1)}</div>
            ))}
            {isObj && childEntries.map(([k,v]) => (
              <div key={path + '.' + k}>{renderNode(v, path + '.' + k, k, depth + 1)}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Wrapper component to apply performance cap while reusing existing renderNode
  const RenderTreeRoot: React.FC<{ value: unknown; renderNode: typeof renderNode; perfMode: boolean }> = ({ value, renderNode, perfMode }) => {
    const MAX_NODES = 5000; // soft cap
    if (!perfMode) return <>{renderNode(value, 'root', 'root')}</>;
    // We perform a shallow traversal counting nodes; if exceeding cap, render truncated message.
    let count = 0;
    const walkCount = (v: unknown) => {
      count++;
      if (count > MAX_NODES) return;
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) v.forEach(walkCount); else Object.values(v as Record<string, unknown>).forEach(walkCount);
      }
    };
    walkCount(value);
    if (count <= MAX_NODES) return <>{renderNode(value, 'root', 'root')}</>;
    return (
      <div className="space-y-2">
        <div className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
          Performance mode active: structure is very large ({'>'} {MAX_NODES.toLocaleString()} nodes). Display truncated. Disable Perf Off to view full tree (may be slow).
        </div>
        {renderNode(value, 'root', 'root')}
      </div>
    );
  };

  function applyEdit() {
    if (!result?.parsed || editPath === null) return;
    // parse new primitive
    let newVal: unknown = editValue;
    const trimmed = editValue.trim();
    if (trimmed === 'null') newVal = null;
    else if (trimmed === 'true') newVal = true;
    else if (trimmed === 'false') newVal = false;
    else if (trimmed === '') newVal = '';
    else if (!Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) newVal = Number(trimmed);
    else {
      // treat as string (keep raw)
      newVal = editValue;
    }
    try {
      // clone current parsed to avoid mutation side-effects
      const rootCopy = structuredClone ? structuredClone(result.parsed) : JSON.parse(JSON.stringify(result.parsed));
      const parts = editPath.split('.').slice(1); // remove root
      let cur: any = rootCopy; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (let i = 0; i < parts.length - 1; i++) {
        const seg = parts[i];
        if (Array.isArray(cur)) {
          const idx = Number(seg);
          if (Number.isNaN(idx) || !(idx in cur)) throw new Error('Invalid path');
          cur = cur[idx];
        } else if (cur && typeof cur === 'object') {
          cur = (cur as Record<string, unknown>)[seg];
        } else {
          throw new Error('Cannot traverse path');
        }
      }
      const last = parts[parts.length - 1];
      if (Array.isArray(cur)) {
        const idx = Number(last);
        if (Number.isNaN(idx)) throw new Error('Invalid array index');
        cur[idx] = newVal;
      } else if (cur && typeof cur === 'object') {
        (cur as Record<string, unknown>)[last] = newVal;
      } else throw new Error('Invalid target for edit');

      const formatted = JSON.stringify(rootCopy, null, 2);
      setResult({ raw: result.raw, formatted, parsed: rootCopy });
  pushHistory({ raw: result.raw, formatted, parsed: rootCopy });
      setEditPath(null);
      setEditValue('');
      push({ title: 'Updated', description: 'Value updated successfully', variant: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Edit failed';
      push({ title: 'Edit Error', description: msg, variant: 'error' });
    }
  }

  const tableData = useMemo(() => {
    if (!result?.parsed) return null;
    if (!Array.isArray(result.parsed)) return null;
    const arr = result.parsed;
    if (!arr.every(r => r && typeof r === 'object' && !Array.isArray(r))) return null;
    const rows = arr as Record<string, unknown>[];
    const headers = Array.from(rows.reduce<Set<string>>((acc, r) => { Object.keys(r).forEach(k => acc.add(k)); return acc; }, new Set()));
    return { headers, rows };
  }, [result?.parsed]);

  const showTree: boolean = mode === 'tree' && !!result?.parsed && !result?.error;

  // Search logic: build path index
  useEffect(() => {
    if (!showTree || !result?.parsed || !search.trim()) {
      setMatchPaths([]);
      setActiveMatchIndex(0);
      setSearchError('');
      return;
    }
    let matcher: (v: string) => boolean;
    if (searchMode === 'regex') {
      try {
        const re = new RegExp(search, 'i');
        matcher = (v: string) => re.test(v);
        setSearchError('');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Invalid regex';
        setSearchError(msg);
        setMatchPaths([]);
        return;
      }
    } else {
      const term = search.toLowerCase();
      matcher = (v: string) => v.toLowerCase().includes(term);
      setSearchError('');
    }
    const matches: string[] = [];
    const expandPaths: Set<string> = new Set();
    const walk = (val: unknown, p: string) => {
      let hit = false;
      if (val === null) hit = matcher('null');
      else if (typeof val === 'string') hit = matcher(val);
      else if (typeof val === 'number' || typeof val === 'boolean') hit = matcher(String(val));
      if (p === 'root') hit = false;
      if (hit) {
        matches.push(p);
        const parts = p.split('.');
        for (let i = 1; i < parts.length; i++) {
          expandPaths.add(parts.slice(0, i).join('.'));
        }
      }
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) val.forEach((v,i)=> walk(v, p + '.' + i));
        else Object.entries(val as Record<string, unknown>).forEach(([k,v]) => walk(v, p + '.' + k));
      }
    };
    walk(result.parsed, 'root');
    // Expand ancestors of matches
    if (expandPaths.size) {
      setCollapsed(prev => {
        const next = new Set(prev);
        expandPaths.forEach(a => next.delete(a));
        return next;
      });
    }
    setMatchPaths(matches);
    setActiveMatchIndex(0);
  }, [search, result?.parsed, showTree, searchMode]);

  function nextMatch(offset: number) {
    if (matchPaths.length === 0) return;
    setActiveMatchIndex(i => (i + offset + matchPaths.length) % matchPaths.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold tracking-tight">JSON Tools</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-md overflow-hidden border">
            {(['text','tree','table'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-2 py-1 text-xs font-medium ${mode===m? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>{m.toUpperCase()}</button>
            ))}
          </div>
          <div className="flex rounded-md overflow-hidden border">
            <button
              onClick={undo}
              disabled={! (historyIndex > 0)}
              className={`px-2 py-1 text-xs font-medium disabled:opacity-40 ${historyIndex>0? 'hover:bg-muted' : ''}`}
              title="Undo (⌘/Ctrl+Z)"
            >Undo</button>
            <button
              onClick={redo}
              disabled={! (historyIndex >=0 && historyIndex < history.length -1)}
              className={`px-2 py-1 text-xs font-medium disabled:opacity-40 ${historyIndex>=0 && historyIndex < history.length -1? 'hover:bg-muted' : ''}`}
              title="Redo (⌘/Ctrl+Shift+Z)"
            >Redo</button>
          </div>
          <button onClick={formatJson} className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90">Format</button>
          <button onClick={copyFormatted} disabled={!result?.formatted} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Copy</button>
          <button onClick={exportCsv} className="rounded-md border px-3 py-1.5 text-sm font-medium">JSON → CSV</button>
          <button onClick={minifyJson} disabled={!result?.parsed} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Minify</button>
          <button onClick={downloadJson} disabled={!result?.formatted} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Download</button>
          {showTree ? (
            <div className="flex gap-1 items-center">
              <button onClick={expandAll} className="rounded border px-2 py-1 text-xs">Expand All</button>
              <button onClick={collapseAll} className="rounded border px-2 py-1 text-xs">Collapse All</button>
              <button onClick={() => setSortKeys(s => !s)} className={`rounded border px-2 py-1 text-xs ${sortKeys ? 'bg-accent text-accent-foreground' : ''}`}>{sortKeys ? 'Unsort Keys' : 'Sort Keys'}</button>
              <div className="flex items-center gap-1 text-[10px] ml-1">
                <span className="text-muted-foreground">Depth</span>
                <select
                  value={depthLimit === null ? '' : depthLimit}
                  onChange={e => {
                    const v = e.target.value === '' ? null : Number(e.target.value);
                    setDepthLimit(v);
                    if (v === null) {
                      // reset collapse state
                      setCollapsed(new Set());
                    } else {
                      collapseToDepth(v);
                    }
                  }}
                  className="border rounded px-1 py-0.5 bg-background"
                >
                  <option value="">All</option>
                  {[0,1,2,3,4,5,6].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            <button
              onClick={() => setPerfMode(p => !p)}
              className={`rounded border px-2 py-1 text-xs ${perfMode ? 'bg-accent text-accent-foreground' : ''}`}
              title="Performance mode caps rendered nodes for very large JSON"
            >{perfMode ? 'Perf On' : 'Perf Off'}</button>
            </div>
          ) : null}
        </div>
      </div>
      {showTree && (
        <div className="flex items-center gap-2 text-xs">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-56 rounded-md border bg-background px-2 py-1"
          />
          {search && (
            <>
              <span className="text-muted-foreground">{matchPaths.length} match{matchPaths.length!==1 && 'es'}</span>
              <button disabled={!matchPaths.length} onClick={() => nextMatch(-1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Prev</button>
              <button disabled={!matchPaths.length} onClick={() => nextMatch(1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Next</button>
              {matchPaths.length > 0 && <span className="text-muted-foreground">{activeMatchIndex+1}/{matchPaths.length}</span>}
            </>
          )}
          <button
            onClick={() => setSearchMode(m => m === 'plain' ? 'regex' : 'plain')}
            className={`rounded border px-2 py-0.5 ${searchMode === 'regex' ? 'bg-accent text-accent-foreground' : ''}`}
          >{searchMode === 'regex' ? 'Regex' : 'Plain'}</button>
          {searchError && <span className="text-red-600 dark:text-red-400 text-[10px]" title={searchError}>Regex Error</span>}
          {selectedPath && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground truncate max-w-[180px]" title={selectedPath}>Selected: {selectedPath.replace(/^root\.?/,'')}</span>
              <button
                onClick={() => {
                  const pathToCopy = selectedPath.replace(/^root\.?/,'');
                  navigator.clipboard.writeText(pathToCopy || 'root');
                  push({ title: 'Copied', description: 'Path copied to clipboard', variant: 'success'});
                }}
                className="rounded border px-2 py-0.5"
              >Copy Path</button>
              <button
                onClick={() => {
                  // Convert to JSON Pointer (RFC6901)
                  // root.a.b.0 -> /a/b/0
                  const rel = selectedPath.replace(/^root\.?/, '');
                  if (!rel) {
                    navigator.clipboard.writeText('');
                    push({ title: 'Copied', description: 'Root pointer copied', variant: 'success'});
                    return;
                  }
                  const pointer = '/' + rel.split('.').map(seg => seg.replace(/~/g,'~0').replace(/\//g,'~1')).join('/');
                  navigator.clipboard.writeText(pointer);
                  push({ title: 'Copied', description: 'JSON Pointer copied', variant: 'success'});
                }}
                className="rounded border px-2 py-0.5"
              >Copy Pointer</button>
              <button
                onClick={() => {
                  if (!result?.parsed) return;
                  const parts = selectedPath.split('.').slice(1); // remove synthetic root
                  let cur: unknown = result.parsed as unknown;
                  for (const part of parts) {
                    if (part === '') continue;
                    if (cur === null || cur === undefined) break;
                    if (typeof cur === 'object') {
                      if (Array.isArray(cur)) {
                        const idx = Number(part);
                        if (!Number.isNaN(idx)) cur = (cur as unknown[])[idx]; else { cur = undefined; break; }
                      } else {
                        cur = (cur as Record<string, unknown>)[part];
                      }
                    } else {
                      cur = undefined; break;
                    }
                  }
                  const valStr = typeof cur === 'object' ? JSON.stringify(cur) : String(cur ?? '');
                  navigator.clipboard.writeText(valStr);
                  push({ title: 'Copied', description: 'Value copied to clipboard', variant: 'success'});
                }}
                className="rounded border px-2 py-0.5"
              >Copy Value</button>
            </div>
          )}
        </div>
      )}
      {showTree && nodeCount > LARGE_THRESHOLD && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2 text-[11px] leading-snug text-yellow-700 dark:text-yellow-400">
          Large JSON detected (~{nodeCount.toLocaleString()} nodes). Auto-expansion is limited; consider searching or sorting selectively for performance.
        </div>
      )}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Paste JSON here...'
        className="w-full h-80 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
      />
      {result?.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">
          {result.error}
        </div>
      )}
      {!result?.error && mode === 'text' && result?.formatted && (
        <pre className="rounded-md border bg-muted p-3 text-xs max-h-96 overflow-auto font-mono whitespace-pre">{result.formatted}</pre>
      )}
      {showTree && (
        <div className="rounded-md border bg-muted/40 p-3 text-xs max-h-96 overflow-auto font-mono">
          {result?.parsed ? (
            <RenderTreeRoot value={result.parsed as unknown} renderNode={renderNode} perfMode={perfMode} />
          ) : null}
        </div>
      )}
      {mode === 'table' && (
        tableData ? (
          <div className="rounded-md border overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>{tableData.headers.map(h => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {tableData.rows.map((r,i) => (
                  <tr key={i} className="odd:bg-muted/30">
                    {tableData.headers.map(h => {
                      const v = r[h];
                      let cell: string;
                      if (v === null || v === undefined) cell = '';
                      else if (typeof v === 'object') cell = JSON.stringify(v).slice(0,120);
                      else cell = String(v);
                      return <td key={h} className="px-2 py-1 align-top" title={typeof v === 'object' ? JSON.stringify(v) : undefined}>{cell}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">Table view requires an array of plain objects.</div>
        )
      )}
      <p className="text-[10px] text-muted-foreground">Modes: Text (raw pretty JSON), Tree (expand/collapse nodes), Table (array of objects). Large payloads may be slower – consider trimming before formatting.</p>
    </div>
  );
}
