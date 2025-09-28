"use client";
import { useState, useRef } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface GeneratedItem {
  id: string;
  version: 'v4' | 'v7';
}

// RFC4122 v4 UUID generation using crypto.getRandomValues
function uuidv4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Set version (4) in high nibble of byte 6 and variant (10x) in high bits of byte 8
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return (
    toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + '-' +
    toHex(bytes[4]) + toHex(bytes[5]) + '-' +
    toHex(bytes[6]) + toHex(bytes[7]) + '-' +
    toHex(bytes[8]) + toHex(bytes[9]) + '-' +
    toHex(bytes[10]) + toHex(bytes[11]) + toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
  );
}

// Minimal draft UUID v7 implementation per https://datatracker.ietf.org/doc/draft-ietf-uuidrev-rfc4122bis/
// Layout (128 bits):
// - unix_ts_ms: 48 bits (ms since epoch)
// - version: 4 bits (0111)
// - sub-ms rand: 12 bits
// - variant: 2-3 bits (10x) + remaining 62-63 bits randomness / sequence
// We'll supply: 48 ts ms + version nibble + 12 random + variant bits + 62 random.
// Monotonic guarantee: if same ms as previous, increment a 12-bit counter replacing sub-ms rand space.
const lastState = { ms: 0, seq: 0 };
function uuidv7(): string {
  const now = Date.now();
  if (now === lastState.ms) {
    lastState.seq = (lastState.seq + 1) & 0x0fff; // 12-bit rollover
  } else {
    lastState.ms = now;
    lastState.seq = crypto.getRandomValues(new Uint16Array(1))[0] & 0x0fff; // random start
  }

  const bytes = new Uint8Array(16);
  // Write 48-bit timestamp big-endian
  // Extract 48-bit timestamp (ms) without BigInt to remain compatible with lower targets
  let msTemp = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = msTemp & 0xff;
    msTemp = Math.floor(msTemp / 256);
  }
  // Next 4 bits version (7) + 12 bits sequence/random (we use seq)
  // bytes[6] high nibble already is next position after first 6 bytes (index 6 & 7 store this 16-bit block)
  bytes[6] = (0x70 /* version 7 nibble */) | ((lastState.seq >> 8) & 0x0f); // high 4 bits version + high 4 bits of seq
  bytes[7] = lastState.seq & 0xff; // low 8 bits of seq
  // Variant in byte 8 high bits (10xx xxxx)
  const rand = new Uint8Array(8);
  crypto.getRandomValues(rand);
  bytes[8] = (rand[0] & 0x3f) | 0x80; // variant 10xx xxxx
  // Fill remaining 7 bytes
  for (let i = 9; i < 16; i++) bytes[i] = rand[i - 8 + 1];

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return (
    toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + toHex(bytes[4]) + toHex(bytes[5]) + '-' +
    toHex(bytes[6]) + toHex(bytes[7]) + '-' +
    toHex(bytes[8]) + toHex(bytes[9]) + '-' +
    toHex(bytes[10]) + toHex(bytes[11]) + '-' +
    toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
  );
}

export function UuidGeneratorTool() {
  const [count, setCount] = useState(5);
  const [includeV4, setIncludeV4] = useState(true);
  const [includeV7, setIncludeV7] = useState(true);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const { push } = useToast();
  const listRef = useRef<HTMLDivElement | null>(null);

  function generate() {
    if (!includeV4 && !includeV7) {
      push({ title: 'Select a version', description: 'Enable at least one UUID version', variant: 'error' });
      return;
    }
    const c = Math.min(50, Math.max(1, count));
    const gen: GeneratedItem[] = [];
    for (let i = 0; i < c; i++) {
      if (includeV4) gen.push({ id: uuidv4(), version: 'v4' });
      if (includeV7) gen.push({ id: uuidv7(), version: 'v7' });
    }
    setItems(gen);
    // Scroll into view for better UX
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 10);
    push({ title: 'Generated', description: `${gen.length} UUID${gen.length === 1 ? '' : 's'} created`, variant: 'success' });
  }

  function copyOne(id: string) {
    navigator.clipboard.writeText(id);
    push({ title: 'Copied', description: 'UUID copied to clipboard', variant: 'success' });
  }

  function copyAll() {
    if (!items.length) return;
    navigator.clipboard.writeText(items.map(i => i.id).join('\n'));
    push({ title: 'Copied', description: 'All UUIDs copied (newline separated)', variant: 'success' });
  }

  function reset() {
    setItems([]);
    push({ title: 'Reset', description: 'Cleared generated UUIDs', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">UUID Generator</h2>
        <div className="flex gap-2">
          <button onClick={generate} className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90">Generate</button>
          <button onClick={copyAll} disabled={!items.length} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Copy All</button>
          <button onClick={reset} disabled={!items.length} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Reset</button>
        </div>
      </div>
      <form onSubmit={e => { e.preventDefault(); generate(); }} className="flex flex-wrap gap-4 items-end">
        <label className="text-sm space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Count (1–50 per version)</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={e => setCount(parseInt(e.target.value || '1', 10))}
            className="w-28 h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/30"
            aria-describedby="uuid-count-hint"
          />
        </label>
        <fieldset className="flex gap-4 items-center" aria-label="UUID versions">
          <label className="flex items-center gap-1 text-xs font-medium">
            <input type="checkbox" checked={includeV4} onChange={e => setIncludeV4(e.target.checked)} /> v4
          </label>
          <label className="flex items-center gap-1 text-xs font-medium">
            <input type="checkbox" checked={includeV7} onChange={e => setIncludeV7(e.target.checked)} /> v7
          </label>
        </fieldset>
        <button type="submit" className="h-9 px-3 rounded-md border bg-background text-sm font-medium shadow hover:bg-muted">Run</button>
      </form>
      <div ref={listRef} className="space-y-2 max-h-64 overflow-auto pr-1" aria-live="polite">
        {!items.length && <p className="text-xs text-muted-foreground">No UUIDs yet. Choose versions & generate.</p>}
        {items.map((item, idx) => (
          <div key={idx} className="group flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs font-mono">
            <span className="truncate" title={item.id}>{item.id}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
              <span className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-medium">{item.version}</span>
              <button type="button" onClick={() => copyOne(item.id)} className="underline text-[10px]">copy</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
