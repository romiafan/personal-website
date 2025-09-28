"use client";
import { useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';

const BASE_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.
Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim.
Pellentesque congue.`;

function generateParagraphs(count: number): string[] {
  // Split base text to sentences for mild variation
  const sentences = BASE_TEXT.split(/\n|\./).map(s => s.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    // Create a pseudo-random selection without external libs
    const len = Math.max(3, Math.min(6, (i % 4) + 3));
    const picks: string[] = [];
    for (let j = 0; j < len; j++) {
      const idx = (i * 7 + j * 3 + sentences.length) % sentences.length;
      picks.push(sentences[idx]);
    }
    paragraphs.push(picks.join('. ') + '.');
  }
  return paragraphs;
}

export function LoremIpsumTool() {
  const [count, setCount] = useState(3);
  const [paragraphs, setParagraphs] = useState<string[]>(() => generateParagraphs(3));
  const { push } = useToast();

  function handleGenerate() {
    const clamped = Math.min(10, Math.max(1, count));
    setParagraphs(generateParagraphs(clamped));
  }

  function copyAll() {
    if (!paragraphs.length) return;
    const text = paragraphs.join('\n\n');
    navigator.clipboard.writeText(text);
    push({ title: 'Copied', description: 'Lorem ipsum copied', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Lorem Ipsum</h2>
      </div>
      <div className="flex gap-3 items-end flex-wrap">
        <label className="text-sm space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Paragraphs (1-10)</span>
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={e => setCount(parseInt(e.target.value || '1', 10))}
            className="w-24 h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/30"
          />
        </label>
        <button
          type="button"
            onClick={handleGenerate}
            className="h-9 px-3 rounded-md border bg-primary text-primary-foreground text-sm font-medium shadow hover:opacity-90 transition"
        >Generate</button>
        <button
          type="button"
          onClick={copyAll}
          className="h-9 px-3 rounded-md border bg-background text-sm font-medium shadow hover:bg-muted transition"
        >Copy All</button>
      </div>
      <div className="space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">{p}</p>
        ))}
      </div>
    </div>
  );
}
