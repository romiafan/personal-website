"use client";
import { useState, useCallback } from 'react';
import { useToast } from '@/components/providers/toast-provider';

type Mode = 'base64' | 'url';

interface ResultState {
  output: string;
  error?: string;
}

function encodeBase64(input: string): string {
  // Handle unicode properly
  const utf8 = new TextEncoder().encode(input);
  let binary = '';
  utf8.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeBase64(input: string): string {
  const bin = atob(input);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function CodecTool() {
  const { push } = useToast();
  const [mode, setMode] = useState<Mode>('base64');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<ResultState>({ output: '' });
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  const run = useCallback(() => {
    try {
      let output = '';
      if (mode === 'base64') {
        if (direction === 'encode') {
          output = encodeBase64(source);
        } else {
          output = decodeBase64(source.trim());
        }
      } else {
        if (direction === 'encode') {
          output = encodeURIComponent(source);
        } else {
          output = decodeURIComponent(source);
        }
      }
      setResult({ output });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setResult({ output: '', error: msg });
    }
  }, [mode, direction, source]);

  function copyOutput() {
    if (!result.output) return;
    navigator.clipboard.writeText(result.output);
    push({ title: 'Copied', description: 'Output copied', variant: 'success' });
  }

  function swap() {
    if (!result.output) return;
    setSource(result.output);
    setResult({ output: '' });
    push({ title: 'Swapped', description: 'Output moved to input', variant: 'success' });
  }

  function clearAll() {
    setSource('');
    setResult({ output: '' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Base64 / URL Codec</h2>
        <div className="flex gap-2 items-center">
          <select
            value={mode}
            onChange={e => setMode(e.target.value as Mode)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label="Codec mode"
          >
            <option value="base64">Base64</option>
            <option value="url">URL</option>
          </select>
          <select
            value={direction}
            onChange={e => setDirection(e.target.value as 'encode' | 'decode')}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label="Direction"
          >
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
          <button
            onClick={run}
            className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            type="button"
          >Run</button>
          <button
            onClick={swap}
            disabled={!result.output}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            type="button"
          >Swap</button>
          <button
            onClick={clearAll}
            className="rounded-md border px-3 py-1.5 text-sm font-medium"
            type="button"
          >Clear</button>
          <button
            onClick={copyOutput}
            disabled={!result.output}
            className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            type="button"
          >Copy</button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Input</label>
          <textarea
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder={direction === 'encode' ? 'Enter raw text...' : (mode === 'base64' ? 'Enter Base64...' : 'Enter encoded URL component...')}
            className="w-full h-48 resize-none rounded-md border bg-background px-3 py-2 text-xs font-mono focus-visible:ring focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Output</label>
          {result.error ? (
            <div className="h-48 overflow-auto rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">{result.error}</div>
          ) : (
            <pre className="h-48 overflow-auto rounded-md border bg-muted p-2 text-xs font-mono whitespace-pre-wrap">
              {result.output}
            </pre>
          )}
        </div>
      </div>
      {mode === 'base64' && direction === 'decode' && result.error && (
        <p className="text-[10px] text-muted-foreground">Tip: Ensure proper padding or remove whitespace.</p>
      )}
    </div>
  );
}
