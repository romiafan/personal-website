"use client";
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

interface FilterState {
  action?: string;
  status?: string;
}

export function AuditLogViewer() {
  const [filters, setFilters] = useState<FilterState>({});
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const data = useQuery(api.auditLogs.list, { action: filters.action, status: filters.status, cursor, limit: 25 });

  const items = data?.items ?? [];

  function applyFilter<K extends keyof FilterState>(key: K, value: string) {
    setCursor(undefined); // reset pagination when filter changes
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  }

  function relative(ts: string) {
    const now = Date.now();
    const t = new Date(ts).getTime();
    const diff = now - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return sec + 's ago';
    const min = Math.floor(sec / 60); if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60); if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr / 24); if (day < 7) return day + 'd ago';
    const wk = Math.floor(day / 7); if (wk < 4) return wk + 'w ago';
    const mo = Math.floor(day / 30); if (mo < 12) return mo + 'mo ago';
    const yr = Math.floor(day / 365); return yr + 'y ago';
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-semibold tracking-tight">Audit Logs</h2>
        <div className="flex gap-2 flex-wrap text-xs">
          <select value={filters.action || ''} onChange={e => applyFilter('action', e.target.value)} className="rounded border bg-background px-2 py-1">
            <option value="">All Actions</option>
            <option value="github.sync">github.sync</option>
          </select>
          <select value={filters.status || ''} onChange={e => applyFilter('status', e.target.value)} className="rounded border bg-background px-2 py-1">
            <option value="">All Status</option>
            <option value="success">success</option>
            <option value="error">error</option>
          </select>
          {cursor && (
            <button onClick={() => setCursor(undefined)} className="rounded border px-2 py-1">Reset Page</button>
          )}
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-2 py-1 font-medium">Time</th>
              <th className="px-2 py-1 font-medium">Action</th>
              <th className="px-2 py-1 font-medium">Status</th>
              <th className="px-2 py-1 font-medium">Actor</th>
              <th className="px-2 py-1 font-medium">Target</th>
              <th className="px-2 py-1 font-medium">Count</th>
              <th className="px-2 py-1 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map(l => (
              <tr key={l._id} className={l.status === 'error' ? 'bg-destructive/10' : ''}>
                <td className="px-2 py-1 whitespace-nowrap font-mono" title={new Date(l.created_at).toISOString()}>{relative(l.created_at)}</td>
                <td className="px-2 py-1">{l.action}</td>
                <td className="px-2 py-1">
                  <span className={l.status === 'error' ? 'text-destructive font-semibold' : 'text-green-600 dark:text-green-400'}>{l.status}</span>
                </td>
                <td className="px-2 py-1">{l.actor}</td>
                <td className="px-2 py-1">{l.target || '-'}</td>
                <td className="px-2 py-1">{l.count ?? ''}</td>
                <td className="px-2 py-1 max-w-[200px] truncate" title={l.message}>{l.message || ''}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No logs</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center text-xs">
        <div>{items.length} shown</div>
        <div className="flex gap-2">
          <button
            onClick={() => setCursor(data?.nextCursor || undefined)}
            disabled={!data?.nextCursor}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >Next Page</button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Data refreshes live via Convex query; pagination is forward-only using created_at cursor.</p>
    </div>
  );
}
