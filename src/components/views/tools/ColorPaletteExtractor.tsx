"use client";
import { useState, useRef } from 'react';
import { useToast } from '@/components/providers/toast-provider';

interface Swatch {
  hex: string;
  count: number;
  percent: number;
}

// Convert r,g,b to hex
function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Simple color quantization: sample pixels then k-means like clustering with fixed iterations
function extractPalette(data: Uint8ClampedArray, maxColors = 6, sampleStep = 4): Swatch[] {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const a = data[i + 3];
    if (a < 32) continue; // skip mostly transparent
    pixels.push([r, g, b]);
  }
  if (pixels.length === 0) return [];

  // Initialize centroids by picking evenly spaced samples
  const centroids: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(pixels.length / maxColors));
  for (let i = 0; i < maxColors; i++) centroids.push(pixels[Math.min(i * step, pixels.length - 1)]);

  for (let iter = 0; iter < 8; iter++) {
    const clusters: [number, number, number, number][] = centroids.map(() => [0, 0, 0, 0]);
    for (const [r, g, b] of pixels) {
      let best = 0; let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const [cr, cg, cb] = centroids[c];
        const dr = r - cr, dg = g - cg, db = b - cb;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      clusters[best][0] += r; clusters[best][1] += g; clusters[best][2] += b; clusters[best][3]++;
    }
    for (let c = 0; c < centroids.length; c++) {
      const [sr, sg, sb, count] = clusters[c];
      if (count > 0) centroids[c] = [Math.round(sr / count), Math.round(sg / count), Math.round(sb / count)];
    }
  }

  // Final cluster counts
  const counts = new Array(centroids.length).fill(0);
  for (const [r, g, b] of pixels) {
    let best = 0; let bestDist = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const [cr, cg, cb] = centroids[c];
      const dr = r - cr, dg = g - cg, db = b - cb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    counts[best]++;
  }

  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const swatches: Swatch[] = centroids.map((c, idx) => ({ hex: toHex(c[0], c[1], c[2]), count: counts[idx], percent: counts[idx] / total }));
  return swatches
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors);
}

export function ColorPaletteExtractor() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      push({ title: 'Invalid File', description: 'Please choose an image file', variant: 'error' });
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSwatches([]);
    process(url);
  }

  function process(url: string) {
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas unsupported');
        // constrain size for performance
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const colors = extractPalette(imageData.data, 8, 6);
        setSwatches(colors);
        push({ title: 'Extracted', description: `${colors.length} colors detected`, variant: 'success' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        push({ title: 'Failed', description: msg, variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => {
      setLoading(false);
      push({ title: 'Load Error', description: 'Could not load image', variant: 'error' });
    };
    img.src = url;
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex);
    push({ title: 'Copied', description: `${hex} copied`, variant: 'success' });
  }

  function openFileDialog() {
    fileRef.current?.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Color Palette Extractor</h2>
        <div className="flex gap-2">
          <button onClick={openFileDialog} className="rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground">Select Image</button>
          <button onClick={() => { if (imageUrl) process(imageUrl); }} disabled={!imageUrl || loading} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Re-run</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
      </div>
      {imageUrl && (
        <div className="rounded-md border overflow-hidden bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Uploaded" className="max-h-64 w-full object-contain" />
        </div>
      )}
      {loading && <p className="text-xs text-muted-foreground">Processing…</p>}
      <div className="flex flex-wrap gap-3">
        {swatches.map(s => (
          <button key={s.hex} type="button" onClick={() => copyHex(s.hex)} className="group flex flex-col items-center w-20 focus-visible:outline-none">
            <span
              className="w-20 h-12 rounded-md border shadow-inner"
              style={{ backgroundColor: s.hex }}
              aria-label={s.hex}
            />
            <span className="mt-1 text-[10px] font-mono group-hover:underline">{s.hex}</span>
            <span className="text-[10px] text-muted-foreground">{(s.percent * 100).toFixed(1)}%</span>
          </button>
        ))}
        {!loading && swatches.length === 0 && (
          <p className="text-xs text-muted-foreground">No colors yet. Select an image to extract palette.</p>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">Extraction uses a lightweight k-means style clustering (8 iterations) on a sampled subset for performance.</p>
    </div>
  );
}
