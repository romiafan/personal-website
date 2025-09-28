"use client";
import { useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface InferredInterface {
  code: string;
  error?: string;
}

// Utility to make a valid TypeScript interface identifier from a user supplied root name
function toPascalCase(name: string): string {
  if (!name) return 'Root';
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ') // non-alphanumerics -> space
    .split(' ') // split words
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

type SchemaNode =
  | { kind: 'primitive'; type: string }
  | { kind: 'array'; elements: SchemaNode[] }
  | { kind: 'object'; fields: Record<string, SchemaNode>; optional?: Record<string, boolean> }
  | { kind: 'union'; options: SchemaNode[] };

// Merge two schema nodes for heterogeneous arrays / differing objects
function mergeNodes(a: SchemaNode, b: SchemaNode): SchemaNode {
  // Union merging
  if (a.kind === 'union') {
    const existing = a.options.map(o => serializeNode(o));
    if (!existing.includes(serializeNode(b))) return { kind: 'union', options: [...a.options, b] };
    return a;
  }
  if (b.kind === 'union') return mergeNodes(b, a);

  // Different kinds → union
  if (a.kind !== b.kind) {
    const opts: SchemaNode[] = [];
    const pushUnique = (n: SchemaNode) => { if (!opts.some(o => serializeNode(o) === serializeNode(n))) opts.push(n); };
    pushUnique(a); pushUnique(b);
    return { kind: 'union', options: opts };
  }

  if (a.kind === 'primitive' && b.kind === 'primitive') {
    if (a.type === b.type) return a;
    return { kind: 'union', options: [a, b] };
  }

  if (a.kind === 'array' && b.kind === 'array') {
    const merged: SchemaNode[] = [];
    [...a.elements, ...b.elements].forEach(el => {
      if (!merged.some(m => serializeNode(m) === serializeNode(el))) merged.push(el);
    });
    return { kind: 'array', elements: merged };
  }

  if (a.kind === 'object' && b.kind === 'object') {
    const fields: Record<string, SchemaNode> = { ...a.fields };
    const optional: Record<string, boolean> = { ...(a.optional || {}) };
    for (const key of Object.keys(b.fields)) {
      if (fields[key]) {
        fields[key] = mergeNodes(fields[key], b.fields[key]);
      } else {
        fields[key] = b.fields[key];
        optional[key] = true;
      }
    }
    for (const key of Object.keys(a.fields)) {
      if (!b.fields[key]) optional[key] = true;
    }
    return { kind: 'object', fields, optional };
  }

  return a; // fallback (should not hit)
}

function inferNode(value: unknown): SchemaNode {
  if (value === null) return { kind: 'primitive', type: 'null' };
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return { kind: 'primitive', type: t };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: 'array', elements: [{ kind: 'primitive', type: 'unknown' }] };
    let acc = inferNode(value[0]);
    for (let i = 1; i < value.length; i++) {
      acc = mergeNodes(acc, inferNode(value[i]));
    }
    return { kind: 'array', elements: [acc] };
  }
  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const fields: Record<string, SchemaNode> = {};
    Object.keys(obj).forEach(k => { fields[k] = inferNode(obj[k]); });
    return { kind: 'object', fields };
  }
  return { kind: 'primitive', type: 'unknown' }; // fallback (symbol, function, etc.)
}

// Serialize a node to a stable string for uniqueness comparisons
function serializeNode(node: SchemaNode): string {
  switch (node.kind) {
    case 'primitive': return node.type;
    case 'array': return 'Array<' + node.elements.map(serializeNode).sort().join('|') + '>';
    case 'object': return 'Object{' + Object.keys(node.fields).sort().map(k => k + ':' + serializeNode(node.fields[k])).join(',') + '}';
    case 'union': return 'Union<' + node.options.map(serializeNode).sort().join('|') + '>';
  }
}

// Render TypeScript types & collect nested interfaces
function renderNode(name: string, node: SchemaNode, collected: string[], path: string[] = []): string {
  switch (node.kind) {
    case 'primitive':
      return node.type === 'null' ? 'null' : node.type;
    case 'array': {
      const inner = node.elements.map(el => renderNode(name + 'Item', el, collected, path)).join(' | ');
      return inner.includes('|') ? `(${inner})[]` : inner + '[]';
    }
    case 'union': {
      const parts = node.options.map((o, i) => renderNode(name + 'Variant' + i, o, collected, path));
      const unique = parts.filter((p, i, arr) => arr.indexOf(p) === i);
      return unique.join(' | ');
    }
    case 'object': {
      const interfaceName = path.length === 0 ? name : [...path, name].join('');
      const lines: string[] = ['{'];
      const keys = Object.keys(node.fields).sort();
      for (const k of keys) {
        const fieldNode = node.fields[k];
        const fieldType = renderNode(capitalize(k), fieldNode, collected, [...path, name]);
        const optional = node.optional?.[k] ? '?' : '';
        lines.push(`  ${/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k)}${optional}: ${fieldType};`);
      }
      lines.push('}');
      const body = lines.join('\n');
      collected.push(`interface ${interfaceName} ${body}`);
      return interfaceName;
    }
  }
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function generateInterfaces(json: unknown, rootName: string): string {
  const node = inferNode(json);
  const collected: string[] = [];
  const rootInterfaceName = toPascalCase(rootName || 'Root');
  const rootType = renderNode(rootInterfaceName, node, collected, []);
  // Ensure last collected is root (render may have added it earlier)
  if (!collected.some(c => c.startsWith(`interface ${rootInterfaceName} `))) {
    collected.push(`interface ${rootInterfaceName} ${rootType}`);
  }
  // Deduplicate collected interfaces by signature
  const dedup: string[] = [];
  const signatures = new Set<string>();
  for (const def of collected) {
    if (!signatures.has(def)) { signatures.add(def); dedup.push(def); }
  }
  return dedup.join('\n\n');
}

export function JsonToTsInterfaceTool() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [output, setOutput] = useState<InferredInterface | null>(null);
  const { push } = useToast();

  function run() {
    try {
      if (!input.trim()) {
        setOutput({ code: '', error: 'Provide JSON sample first' });
        push({ title: 'Missing Input', description: 'Paste JSON to infer types', variant: 'error' });
        return;
      }
      const parsed = JSON.parse(input);
      const code = generateInterfaces(parsed, rootName);
      setOutput({ code });
      push({ title: 'Generated', description: 'Interfaces inferred', variant: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parse error';
      setOutput({ code: '', error: msg });
      push({ title: 'Error', description: msg, variant: 'error' });
    }
  }

  function copy() {
    if (!output?.code) return;
    navigator.clipboard.writeText(output.code);
    push({ title: 'Copied', description: 'Interfaces copied to clipboard', variant: 'success' });
  }

  function clearAll() {
    setInput('');
    setOutput(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">JSON → TS Interface</h2>
        <div className="flex gap-2">
          <button onClick={run} className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground">Generate</button>
          <button onClick={copy} disabled={!output?.code} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Copy</button>
          <button onClick={clearAll} className="rounded-md border px-3 py-1.5 text-sm font-medium">Clear</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <label className="text-sm space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Root Interface Name</span>
          <input
            value={rootName}
            onChange={e => setRootName(e.target.value)}
            className="h-9 w-48 rounded-md border bg-background px-2 text-sm font-mono outline-none focus-visible:ring focus-visible:ring-primary/30"
            placeholder="Root"
          />
        </label>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='Paste sample JSON here...'
        className="w-full h-48 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
      />
      {output?.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{output.error}</div>
      )}
      {output?.code && !output.error && (
        <pre className="rounded-md border bg-muted p-3 text-xs max-h-72 overflow-auto font-mono whitespace-pre">{output.code}</pre>
      )}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Notes: Arrays with mixed element shapes become unions. Object keys that appear only in some variants are marked optional. Empty arrays become <code>unknown[]</code>.
      </p>
    </div>
  );
}
