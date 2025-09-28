"use client";
import { useState, useMemo } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface CaseVariant {
  label: string;
  key: string;
  value: string;
}

function normalizeBase(input: string): string[] {
  // Trim, collapse whitespace, remove diacritics, split on non-alphanumeric boundaries.
  const trimmed = input.trim();
  if (!trimmed) return [];
  // NFKD normalize then strip combining marks
  const noDiacritics = trimmed.normalize('NFKD').replace(/\p{M}+/gu, '');
  // Replace underscores and dashes with space to unify segmentation
  const unified = noDiacritics.replace(/[_.-]+/g, ' ');
  // Split camelCase / PascalCase boundaries by inserting space
  const withBoundaries = unified.replace(/([a-z\d])([A-Z])/g, '$1 $2');
  const tokens = withBoundaries
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens;
}

function toSlug(tokens: string[]): string { return tokens.join('-'); }
function toSnake(tokens: string[]): string { return tokens.join('_'); }
function toKebab(tokens: string[]): string { return tokens.join('-'); }
function toConstant(tokens: string[]): string { return tokens.join('_').toUpperCase(); }
function toCamel(tokens: string[]): string {
  if (!tokens.length) return '';
  return tokens[0] + tokens.slice(1).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('');
}
function toPascal(tokens: string[]): string {
  return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('');
}
function toTitle(tokens: string[]): string {
  return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
}

export function CaseConverterTool() {
  const [input, setInput] = useState('Hello world – sample_input forCaseConverter');
  const { push } = useToast();
  const variants = useMemo<CaseVariant[]>(() => {
    const tokens = normalizeBase(input);
    return [
      { label: 'Slug (kebab-case)', key: 'slug', value: toSlug(tokens) },
      { label: 'camelCase', key: 'camel', value: toCamel(tokens) },
      { label: 'PascalCase', key: 'pascal', value: toPascal(tokens) },
      { label: 'snake_case', key: 'snake', value: toSnake(tokens) },
      { label: 'CONSTANT_CASE', key: 'constant', value: toConstant(tokens) },
      { label: 'Title Case', key: 'title', value: toTitle(tokens) },
      { label: 'kebab-case', key: 'kebab', value: toKebab(tokens) },
    ];
  }, [input]);

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    push({ title: 'Copied', description: value.slice(0,60) + (value.length>60?'…':''), variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Case Converter</h2>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full h-28 resize-none rounded-md border bg-background px-3 py-2 text-sm font-mono focus-visible:ring focus-visible:ring-primary/30" aria-label="Source text" placeholder="Enter source text..." />
      <div className="divide-y rounded-md border bg-muted/30">
        {variants.map(v => (
          <div key={v.key} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="w-40 shrink-0 font-medium text-muted-foreground">{v.label}</div>
            <div className="flex-1 overflow-x-auto font-mono text-xs">{v.value || <span className="text-muted-foreground">(empty)</span>}</div>
            <button onClick={() => copy(v.value)} disabled={!v.value} className="ml-2 shrink-0 rounded border px-2 py-1 text-xs disabled:opacity-40">Copy</button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Diacritics stripped via NFKD; punctuation and extra whitespace normalized. Camel/Pascal boundaries detected.</p>
    </div>
  );
}
