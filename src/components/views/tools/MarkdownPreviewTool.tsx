"use client";
import { useState, useMemo } from 'react';
import { useToast } from '@/components/providers/toast-provider';

// Very small markdown subset parser and sanitizer: headings, bold, italic, code, links, lists, inline code, paragraphs
// Avoids external dependency while keeping XSS-safe by escaping and only allowing a controlled set of tags/attrs.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Basic inline formatting: **bold**, *italic*, `code`, [text](url)
function renderInline(raw: string): string {
  let out = escapeHtml(raw);
  // code spans first to avoid interfering with other markers inside backticks
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code class="inline-code">${c.replace(/</g,'&lt;')}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline">${text}</a>`);
  return out;
}

function parseMarkdown(src: string): string {
  const lines = src.replace(/\r/g, '').split('\n');
  const html: string[] = [];
  let listBuffer: string[] = []; let inCodeBlock = false; let codeBuffer: string[] = []; let codeLang = '';
  function flushList() {
    if (listBuffer.length) {
      html.push('<ul>' + listBuffer.map(li => `<li>${renderInline(li)}</li>`).join('') + '</ul>');
      listBuffer = [];
    }
  }
  function flushCode() {
    if (inCodeBlock) {
      const codeEsc = escapeHtml(codeBuffer.join('\n'));
      html.push(`<pre class="md-code"><code class="language-${codeLang}">${codeEsc}</code></pre>`);
      inCodeBlock = false; codeBuffer = []; codeLang='';
    }
  }
  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (inCodeBlock) {
        flushCode();
        continue;
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = fence[1].trim().slice(0,20);
        continue;
      }
    }
    if (inCodeBlock) { codeBuffer.push(line); continue; }
    const listMatch = line.match(/^[-*+]\s+(.*)$/);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
      continue;
    } else {
      flushList();
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    if (line.trim() === '') {
      html.push('');
      continue;
    }
    html.push(`<p>${renderInline(line)}</p>`);
  }
  flushList(); flushCode();
  return html.join('\n');
}

export function MarkdownPreviewTool() {
  const [input, setInput] = useState<string>(`# Markdown Preview\n\nType **markdown** _here_.\n\n- List item A\n- List item B\n\n\`inline code\` and a [link](https://example.com).\n\n\n\`\`\`ts\nconst x: number = 42;\nconsole.log(x);\n\`\`\``);
  const { push } = useToast();
  const rendered = useMemo(() => parseMarkdown(input), [input]);

  function copyHtml() {
    navigator.clipboard.writeText(rendered);
    push({ title: 'Copied', description: 'Rendered HTML copied', variant: 'success' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">Markdown Preview</h2>
        <div className="flex gap-2">
          <button onClick={copyHtml} className="rounded-md border px-3 py-1.5 text-sm font-medium">Copy HTML</button>
        </div>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full h-48 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
        aria-label="Markdown input"
      />
      <div className="rounded-md border bg-muted/40 p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto" dangerouslySetInnerHTML={{ __html: rendered }} />
      <p className="text-[10px] text-muted-foreground">Supports headings, bold, italic, code blocks, inline code, links (http/https), and unordered lists. Sanitized to prevent scripts.</p>
    </div>
  );
}
