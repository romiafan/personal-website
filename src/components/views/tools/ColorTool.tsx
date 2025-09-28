"use client";
import { useState, useEffect } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface ColorData {
  hex: string;
  rgb: string;
  hsl: string;
  valid: boolean;
}

function parseHex(input: string): ColorData {
  const raw = input.trim().toLowerCase();
  const hexMatch = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hexMatch) {
    return { hex: raw, rgb: '', hsl: '', valid: false };
  }
  let hex = hexMatch[1];
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;
  // Convert to HSL
  const rf = r / 255; const gf = g / 255; const bf = b / 255;
  const max = Math.max(rf, gf, bf); const min = Math.min(rf, gf, bf);
  let h = 0; let s = 0; const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
      case gf: h = (bf - rf) / d + 2; break;
      case bf: h = (rf - gf) / d + 4; break;
    }
    h /= 6;
  }
  const hsl = `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  return { hex: `#${hex}`, rgb, hsl, valid: true };
}

export function ColorTool() {
  const [input, setInput] = useState('');
  const [color, setColor] = useState<ColorData>(() => ({ hex: '', rgb: '', hsl: '', valid: false }));
  const { push } = useToast();

  useEffect(() => {
    if (input === '') {
      setColor({ hex: '', rgb: '', hsl: '', valid: false });
      return;
    }
    const parsed = parseHex(input);
    setColor(parsed);
  }, [input]);

  function copy(value: string, label: string) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    push({ title: 'Copied', description: `${label} copied`, variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Color Utility</h2>
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="#1e40af or 1e40af"
        className="w-full h-10 rounded-md border bg-background px-3 text-sm font-mono outline-none focus-visible:ring focus-visible:ring-primary/30"
      />
      {color.valid ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-md border shadow-inner"
              style={{ backgroundColor: color.hex }}
            />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">HEX:</span>
                <code className="px-1 rounded bg-muted">{color.hex}</code>
                <button onClick={() => copy(color.hex, 'HEX')} className="text-[10px] underline">copy</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">RGB:</span>
                <code className="px-1 rounded bg-muted">{color.rgb}</code>
                <button onClick={() => copy(color.rgb, 'RGB')} className="text-[10px] underline">copy</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">HSL:</span>
                <code className="px-1 rounded bg-muted">{color.hsl}</code>
                <button onClick={() => copy(color.hsl, 'HSL')} className="text-[10px] underline">copy</button>
              </div>
            </div>
          </div>
        </div>
      ) : input ? (
        <p className="text-xs text-red-600 dark:text-red-400">Invalid HEX (use #rgb or #rrggbb)</p>
      ) : (
        <p className="text-xs text-muted-foreground">Enter a HEX color to convert.</p>
      )}
    </div>
  );
}
