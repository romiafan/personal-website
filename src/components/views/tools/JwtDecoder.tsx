"use client";
import { useState, useMemo } from 'react';
import { useToast } from '@/components/providers/toast-provider';

// (DecodedPart interface removed – not currently needed after refactor)

interface JwtMeta {
  exp?: number;
  iat?: number;
  nbf?: number;
}

function safeBase64UrlDecode(segment: string): string | null {
  try {
    const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
    const bytes = atob(padded);
    // Handle UTF-8 decoding
    const arr = new Uint8Array(bytes.split('').map(c => c.charCodeAt(0)));
    return new TextDecoder().decode(arr);
  } catch {
    return null;
  }
}

function pretty(obj: unknown): string {
  try { return JSON.stringify(obj, null, 2); } catch { return ''; }
}

export function JwtDecoder() {
  const [token, setToken] = useState('');
  const { push } = useToast();

  const { header, payload, signature, meta, error } = useMemo<{
    header: { raw: string; json?: string; error?: string } | null;
    payload: { raw: string; json?: string; error?: string } | null;
    signature: string;
    meta: JwtMeta;
    error: string;
  }>(() => {
    if (!token.trim()) return { header: null, payload: null, signature: '', meta: {}, error: '' } as const;
    const parts = token.split('.');
    if (parts.length !== 3) return { header: null, payload: null, signature: '', meta: {}, error: 'JWT must have 3 parts' } as const;
    const [h, p, s] = parts;
    const headerJsonStr = safeBase64UrlDecode(h);
    const payloadJsonStr = safeBase64UrlDecode(p);
    let headerObj: unknown = null; let payloadObj: unknown = null; let headerErr: string | undefined; let payloadErr: string | undefined;
    if (headerJsonStr == null) headerErr = 'Invalid base64url segment';
    else {
      try { headerObj = JSON.parse(headerJsonStr); } catch { headerErr = 'Header JSON parse error'; }
    }
    if (payloadJsonStr == null) payloadErr = 'Invalid base64url segment';
    else {
      try { payloadObj = JSON.parse(payloadJsonStr); } catch { payloadErr = 'Payload JSON parse error'; }
    }
    const meta: JwtMeta = {};
    if (payloadObj && typeof payloadObj === 'object') {
      const po = payloadObj as Record<string, unknown>;
      if (typeof po.exp === 'number') meta.exp = po.exp;
      if (typeof po.iat === 'number') meta.iat = po.iat;
      if (typeof po.nbf === 'number') meta.nbf = po.nbf;
    }
    return {
      header: { raw: h, json: headerObj ? pretty(headerObj) : undefined, error: headerErr },
      payload: { raw: p, json: payloadObj ? pretty(payloadObj) : undefined, error: payloadErr },
      signature: s,
      meta,
      error: ''
    } as const;
  }, [token]);

  function copyPayload() {
    if (payload?.json) {
      navigator.clipboard.writeText(payload.json);
      push({ title: 'Copied', description: 'Payload copied', variant: 'success' });
    }
  }
  function copyHeader() {
    if (header?.json) {
      navigator.clipboard.writeText(header.json);
      push({ title: 'Copied', description: 'Header copied', variant: 'success' });
    }
  }
  function clearAll() {
    setToken('');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expState = useMemo(() => {
    if (!meta.exp) return null;
    if (meta.exp < nowSec) return 'expired';
    const remaining = meta.exp - nowSec;
    const mins = Math.floor(remaining / 60);
    return `${mins}m remaining`;
  }, [meta.exp, nowSec]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">JWT Decoder</h2>
        <div className="flex gap-2">
          <button onClick={copyHeader} disabled={!header?.json} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Copy Header</button>
          <button onClick={copyPayload} disabled={!payload?.json} className="rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50">Copy Payload</button>
          <button onClick={clearAll} className="rounded-md border px-3 py-1.5 text-sm font-medium">Clear</button>
        </div>
      </div>
      <textarea
        value={token}
        onChange={e => setToken(e.target.value.trim())}
        placeholder="Paste JWT here (header.payload.signature)"
        className="w-full h-28 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
      />
      <p className="text-[10px] text-muted-foreground">No signature verification performed. Do not paste sensitive production JWTs.</p>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Header</span>
            {header?.error && <span className="text-red-600 dark:text-red-400">{header.error}</span>}
          </div>
          <div className="rounded-md border bg-muted/40 p-2 max-h-56 overflow-auto">
            {header?.json ? (
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">{header.json}</pre>
            ) : (
              <p className="text-[10px] text-muted-foreground">—</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Payload</span>
            {payload?.error && <span className="text-red-600 dark:text-red-400">{payload.error}</span>}
          </div>
          <div className="rounded-md border bg-muted/40 p-2 max-h-56 overflow-auto">
            {payload?.json ? (
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">{payload.json}</pre>
            ) : (
              <p className="text-[10px] text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-[10px] text-muted-foreground">
        {meta.exp && (
          <p>exp: {meta.exp} ({expState || 'future'})</p>
        )}
        {meta.iat && <p>iat: {meta.iat}</p>}
        {meta.nbf && <p>nbf: {meta.nbf}</p>}
        {signature && <p>Signature (raw base64url, not verified): <code className="break-all">{signature.slice(0, 32)}{signature.length > 32 ? '…' : ''}</code></p>}
      </div>
    </div>
  );
}
