"use client";
import { useState, useMemo } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface DiffLine {
  type: 'context' | 'add' | 'del';
  left?: string;
  right?: string;
  value: string;
}

// Simple LCS-based line diff (not optimized for very large inputs)
function computeDiff(aText: string, bText: string): DiffLine[] {
  const a = aText.split(/\r?\n/);
  const b = bText.split(/\r?\n/);
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1; else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const lines: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      lines.push({ type: 'context', value: a[i], left: a[i], right: b[j] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: 'del', value: a[i], left: a[i] });
      i++;
    } else {
      lines.push({ type: 'add', value: b[j], right: b[j] });
      j++;
    }
  }
  while (i < m) { lines.push({ type: 'del', value: a[i], left: a[i] }); i++; }
  while (j < n) { lines.push({ type: 'add', value: b[j], right: b[j] }); j++; }
  return lines;
}

export function TextDiffTool() {
  const [left, setLeft] = useState('Line one\nLine two\nLine three');
  const [right, setRight] = useState('Line one\nLine two changed\nLine four');
  const [showContextOnly, setShowContextOnly] = useState(false);
  const { push } = useToast();

  const diff = useMemo(() => computeDiff(left, right), [left, right]);

  function copyUnified() {
    const unified: string[] = [];
    diff.forEach(l => {
      if (l.type === 'context') unified.push(' ' + l.value);
      else if (l.type === 'add') unified.push('+' + l.value);
      else unified.push('-' + l.value);
    });
    navigator.clipboard.writeText(unified.join('\n'));
    push({ title: 'Copied', description: 'Unified diff copied', variant: 'success' });
  }

  const filtered = showContextOnly ? diff.filter(d => d.type === 'context') : diff;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Text Diff</h2>
        <div className="flex gap-2">
          <button onClick={copyUnified} className="rounded-md border px-3 py-1.5 text-sm font-medium">Copy Diff</button>
          <label className="flex items-center gap-1 text-xs font-medium select-none">
            <input type="checkbox" checked={showContextOnly} onChange={e => setShowContextOnly(e.target.checked)} /> Context only
          </label>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <textarea
          value={left}
          onChange={e => setLeft(e.target.value)}
          className="w-full h-48 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
          aria-label="Original text"
        />
        <textarea
          value={right}
          onChange={e => setRight(e.target.value)}
          className="w-full h-48 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
          aria-label="Modified text"
        />
      </div>
      <div className="rounded-md border bg-muted/40 max-h-72 overflow-auto text-xs font-mono">
        <pre className="p-2 whitespace-pre">
{filtered.map((l, idx) => {
  let cls = '';
  if (l.type === 'add') cls = 'text-green-600 dark:text-green-400';
  else if (l.type === 'del') cls = 'text-red-600 dark:text-red-400';
  return <div key={idx} className={cls}>{l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '} {l.value || '∅'}</div>;
})}
        </pre>
      </div>
      <p className="text-[10px] text-muted-foreground">Diff uses a lightweight line-based LCS algorithm; for large inputs performance may degrade.</p>
    </div>
  );
}
