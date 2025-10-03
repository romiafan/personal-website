"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { VirtualizedJsonTree } from "./VirtualizedJsonTree";

interface ParseResult {
  raw: string;
  formatted: string;
  error?: string;
  parsed?: unknown;
}

function jsonToCsv(json: unknown): { csv: string; rows: number } {
  if (!Array.isArray(json)) {
    throw new Error("Root JSON must be an array of objects for Excel export");
  }
  if (json.length === 0) return { csv: "", rows: 0 };
  const objects = json as Record<string, unknown>[];
  const headers = Array.from(
    objects.reduce<Set<string>>((acc, obj) => {
      Object.keys(obj).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const obj of objects) {
    lines.push(headers.map((h) => escape(obj[h])).join(","));
  }
  return { csv: lines.join("\n"), rows: objects.length };
}

export function JsonTools() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [mode, setMode] = useState<"text" | "tree" | "table">("text");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [matchPaths, setMatchPaths] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"plain" | "regex">("plain");
  const [depthLimit, setDepthLimit] = useState<number | null>(null);
  const [perfMode, setPerfMode] = useState<boolean>(false);
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [searchError, setSearchError] = useState<string>("");
  // History (undo/redo) for parsed JSON transformations
  const [history, setHistory] = useState<ParseResult[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [persistHistory, setPersistHistory] = useState<boolean>(false);
  const [historySizeWarning, setHistorySizeWarning] = useState<string>("");
  // --- Find & Replace (Issue #20 skeleton) ---
  const [replacePanelOpen, setReplacePanelOpen] = useState(false);
  const [replacePattern, setReplacePattern] = useState("");
  const [replaceFlags, setReplaceFlags] = useState("i");
  const [replaceValue, setReplaceValue] = useState("");
  const [replaceModeRegex, setReplaceModeRegex] = useState(true);
  const [replaceError, setReplaceError] = useState("");
  const [replaceMatchCount, setReplaceMatchCount] = useState<number>(0);

  // LocalStorage keys (centralized)
  const PREFS_KEY = "jsonToolsPrefs";
  const HISTORY_KEY = "jsonToolsHistory";

  // Persist history snapshots (raw + formatted only; parsed reconstructed on load)
  const persistHistorySnapshots = useCallback(
    (snapshots: ParseResult[]) => {
      try {
        const minimal = snapshots.slice(-50).map((s) => ({
          raw: s.raw,
          formatted: s.formatted,
        }));
        const payload = JSON.stringify({ snapshots: minimal });
        // Guard against excessive size (~200KB)
        if (payload.length > 200_000) {
          setHistorySizeWarning(
            "History persistence skipped: exceeds 200KB (clear or reduce edits)."
          );
          return;
        }
        localStorage.setItem(HISTORY_KEY, payload);
        if (historySizeWarning) setHistorySizeWarning("");
      } catch {
        /* ignore */
      }
    },
    [HISTORY_KEY, historySizeWarning]
  );

  const pushHistory = useCallback(
    (entry: ParseResult) => {
      setHistory((prev) => {
        const capped = prev.slice(0, historyIndex + 1); // drop any forward history
        capped.push(entry);
        // limit to last 50 states
        const trimmed = capped.slice(-50);
        setHistoryIndex(trimmed.length - 1);
        if (persistHistory)
          queueMicrotask(() => persistHistorySnapshots(trimmed));
        return trimmed;
      });
    },
    [historyIndex, persistHistory, persistHistorySnapshots]
  );

  const undo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i <= 0) return i;
      const nextIndex = i - 1;
      const restored = history[nextIndex];
      setResult(restored);
      // recompute node count for restored state
      if (restored.parsed) {
        let count = 0;
        const walk = (v: unknown) => {
          count++;
          if (v && typeof v === "object") {
            if (Array.isArray(v)) v.forEach(walk);
            else Object.values(v as Record<string, unknown>).forEach(walk);
          }
        };
        walk(restored.parsed);
        setNodeCount(count);
      }
      return nextIndex;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i < 0 || i >= history.length - 1) return i;
      const nextIndex = i + 1;
      const restored = history[nextIndex];
      setResult(restored);
      if (restored.parsed) {
        let count = 0;
        const walk = (v: unknown) => {
          count++;
          if (v && typeof v === "object") {
            if (Array.isArray(v)) v.forEach(walk);
            else Object.values(v as Record<string, unknown>).forEach(walk);
          }
        };
        walk(restored.parsed);
        setNodeCount(count);
      }
      return nextIndex;
    });
  }, [history]);
  // Load persisted preferences once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const unknownParsed: unknown = JSON.parse(stored);
        if (
          unknownParsed &&
          typeof unknownParsed === "object" &&
          !Array.isArray(unknownParsed)
        ) {
          const parsed = unknownParsed as Record<string, unknown>;
          if (
            parsed.mode === "text" ||
            parsed.mode === "tree" ||
            parsed.mode === "table"
          )
            setMode(parsed.mode);
          if (typeof parsed.sortKeys === "boolean")
            setSortKeys(parsed.sortKeys);
          if (typeof parsed.search === "string") setSearch(parsed.search);
          if (parsed.searchMode === "plain" || parsed.searchMode === "regex")
            setSearchMode(parsed.searchMode);
          if (
            parsed.depthLimit === null ||
            typeof parsed.depthLimit === "number"
          )
            setDepthLimit((parsed.depthLimit as number | null) ?? null);
          if (typeof parsed.perfMode === "boolean")
            setPerfMode(parsed.perfMode);
          if (typeof parsed.persistHistory === "boolean")
            setPersistHistory(parsed.persistHistory);
        }
      }
    } catch {}
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        mode,
        sortKeys,
        search,
        searchMode,
        depthLimit,
        perfMode,
        persistHistory,
      });
      localStorage.setItem(PREFS_KEY, payload);
    } catch {}
  }, [
    mode,
    sortKeys,
    search,
    searchMode,
    depthLimit,
    perfMode,
    persistHistory,
  ]);

  // Load persisted history when enabled (once) if empty
  useEffect(() => {
    if (!persistHistory) return;
    if (history.length > 0) return; // don't overwrite existing in-memory history
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !Array.isArray((parsed as any).snapshots) // eslint-disable-line @typescript-eslint/no-explicit-any
      )
        return;
      const rawSnaps = (
        parsed as { snapshots: Array<{ raw: string; formatted: string }> }
      ).snapshots.slice(-50);
      const rebuilt: ParseResult[] = rawSnaps.map((s) => {
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(s.raw);
        } catch {
          parsedJson = undefined;
        }
        return { raw: s.raw, formatted: s.formatted, parsed: parsedJson };
      });
      if (!rebuilt.length) return;
      setHistory(rebuilt);
      setHistoryIndex(rebuilt.length - 1);
      const latest = rebuilt[rebuilt.length - 1];
      setResult(latest);
      if (latest.parsed) {
        let count = 0;
        const walk = (v: unknown) => {
          count++;
          if (v && typeof v === "object") {
            if (Array.isArray(v)) v.forEach(walk);
            else Object.values(v as Record<string, unknown>).forEach(walk);
          }
        };
        walk(latest.parsed);
        setNodeCount(count);
      }
    } catch {
      /* ignore load errors */
    }
  }, [persistHistory, history.length]);
  const { push } = useToast();
  const [nodeCount, setNodeCount] = useState<number>(0);
  const LARGE_THRESHOLD = 10000; // heuristic

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          // redo
          if (!isTyping) {
            e.preventDefault();
            redo();
          }
        } else {
          // undo
          if (!isTyping) {
            e.preventDefault();
            undo();
          }
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  function formatJson() {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setResult({ raw: input, formatted, parsed });
      pushHistory({ raw: input, formatted, parsed });
      // count nodes for performance guard
      let count = 0;
      const walk = (v: unknown) => {
        count++;
        if (v && typeof v === "object") {
          if (Array.isArray(v)) v.forEach(walk);
          else Object.values(v as Record<string, unknown>).forEach(walk);
        }
      };
      walk(parsed);
      setNodeCount(count);
      push({
        title: "Formatted",
        description: "JSON formatted successfully",
        variant: "success",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown parse error";
      setResult({ raw: input, formatted: "", error: message });
      push({ title: "Parse Error", description: message, variant: "error" });
    }
  }

  function copyFormatted() {
    if (!result?.formatted) return;
    navigator.clipboard.writeText(result.formatted);
    push({
      title: "Copied",
      description: "Formatted JSON copied to clipboard",
      variant: "success",
    });
  }

  function exportCsv() {
    try {
      const parsed = JSON.parse(input);
      const { csv, rows } = jsonToCsv(parsed);
      if (!csv) {
        push({
          title: "No Data",
          description: "Array is empty; nothing to export",
          variant: "error",
        });
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.csv";
      a.click();
      URL.revokeObjectURL(url);
      push({
        title: "Exported",
        description: `Exported ${rows} rows to CSV`,
        variant: "success",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown export error";
      push({ title: "Export Failed", description: message, variant: "error" });
    }
  }

  // Workbook detection & multi-sheet export (Issue #22)
  interface Sheet {
    name: string;
    data: unknown;
  }

  const workbookSheets = useMemo(() => {
    try {
      if (!input.trim()) return null;
      const parsed = JSON.parse(input);
      const detect = (root: unknown): Sheet[] | null => {
        if (root && typeof root === "object" && !Array.isArray(root)) {
          const obj = root as Record<string, unknown>;
          const container = (
            Array.isArray(obj.sheets)
              ? obj.sheets
              : Array.isArray(obj.workbook)
                ? obj.workbook
                : null
          ) as unknown[] | null;
          if (container) {
            const sheets: Sheet[] = container.map((s, i) => {
              if (s && typeof s === "object") {
                const so = s as Record<string, unknown>;
                return {
                  name:
                    typeof so.name === "string" && so.name.trim()
                      ? so.name
                      : `Sheet${i + 1}`,
                  data: so.data,
                };
              }
              return { name: `Sheet${i + 1}`, data: null };
            });
            return sheets.length ? sheets : null;
          }
          const entries = Object.entries(obj);
          if (
            entries.length &&
            entries.every(
              ([, v]) =>
                Array.isArray(v) &&
                (v as unknown[]).every(
                  (r) => r && typeof r === "object" && !Array.isArray(r)
                )
            )
          ) {
            return entries.map(([k, v]) => ({ name: k, data: v }));
          }
        }
        return null;
      };
      return detect(parsed);
    } catch {
      return null;
    }
  }, [input]);

  async function exportWorkbookZip() {
    if (!workbookSheets) return;
    try {
      const [{ default: JSZip }] = await Promise.all([import("jszip")]);
      const zip = new JSZip();
      const skipped: string[] = [];
      let added = 0;
      for (const sheet of workbookSheets) {
        const { name, data } = sheet;
        if (!Array.isArray(data)) {
          skipped.push(name);
          continue;
        }
        if (
          !data.every((r) => r && typeof r === "object" && !Array.isArray(r))
        ) {
          skipped.push(name);
          continue;
        }
        try {
          const { csv, rows } = jsonToCsv(data);
          const safe =
            name.replace(/[^A-Za-z0-9-_]+/g, "_") || `Sheet${added + 1}`;
          zip.file(`${safe}.csv`, csv);
          added += rows;
        } catch {
          skipped.push(name);
        }
      }
      if (added === 0) {
        push({
          title: "Export Failed",
          description: "No valid sheet data to export",
          variant: "error",
        });
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workbook_export_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      push({
        title: "Workbook Exported",
        description: `Sheets exported (${added} rows total)${skipped.length ? `; skipped: ${skipped.join(", ")}` : ""}`,
        variant: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Workbook export failed";
      push({ title: "Export Failed", description: msg, variant: "error" });
    }
  }

  // XLSX export (Issue #23) - dynamic import sheetjs
  async function exportWorkbookXlsx() {
    if (!workbookSheets) return;
    try {
      const XLSX = await getXLSX();
      // gather normalized sheet data first
      const normalized = workbookSheets.map((s) => {
        if (
          !Array.isArray(s.data) ||
          !s.data.every((r) => r && typeof r === "object" && !Array.isArray(r))
        )
          return { ...s, rows: [] as Record<string, unknown>[] };
        return { ...s, rows: s.data as Record<string, unknown>[] };
      });
      const valid = normalized.filter((s) => s.rows.length);
      if (!valid.length) {
        push({
          title: "Export Failed",
          description: "No valid sheet rows for XLSX",
          variant: "error",
        });
        return;
      }
      // compute cell count for guard
      let cellCount = 0;
      for (const sheet of valid) {
        const keySet = new Set<string>();
        sheet.rows.forEach((r) => Object.keys(r).forEach((k) => keySet.add(k)));
        cellCount += sheet.rows.length * keySet.size;
      }
      const LARGE_CELL_THRESHOLD = 200_000;
      if (cellCount > LARGE_CELL_THRESHOLD) {
        const proceed = confirm(
          `This workbook is large (≈${cellCount.toLocaleString()} cells). Export may be slow. Continue?`
        );
        if (!proceed) return;
      }
      const wb = XLSX.utils.book_new();
      for (const sheet of valid) {
        const keyOrder: string[] = [];
        const seen = new Set<string>();
        sheet.rows.forEach((r) => {
          Object.keys(r).forEach((k) => {
            if (!seen.has(k)) {
              seen.add(k);
              keyOrder.push(k);
            }
          });
        });
        const dataMatrix = [
          keyOrder,
          ...sheet.rows.map((r) =>
            keyOrder.map((k) => {
              const v = (r as Record<string, unknown>)[k];
              if (v === null || v === undefined) return "";
              if (typeof v === "object") return JSON.stringify(v);
              return v as unknown;
            })
          ),
        ];
        const ws = XLSX.utils.aoa_to_sheet(dataMatrix);
        const safe =
          sheet.name.replace(/[^A-Za-z0-9-_]+/g, "_").slice(0, 31) || "Sheet";
        XLSX.utils.book_append_sheet(wb, ws, safe);
      }
      const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workbook_export_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      push({
        title: "XLSX Exported",
        description: `Workbook exported (${valid.length} sheet${valid.length !== 1 ? "s" : ""})`,
        variant: "success",
      });
    } catch (e: unknown) {
      // If first attempt failed, try one quick retry (e.g., transient chunk load error)
      try {
        await new Promise((r) => setTimeout(r, 250));
        const XLSX = await getXLSX(true); // force retry path order
        // Re-run simplified flow only if workbookSheets still valid
        const normalized = workbookSheets.map((s) => {
          if (
            !Array.isArray(s.data) ||
            !s.data.every(
              (r) => r && typeof r === "object" && !Array.isArray(r)
            )
          )
            return { ...s, rows: [] as Record<string, unknown>[] };
          return { ...s, rows: s.data as Record<string, unknown>[] };
        });
        const valid = normalized.filter((s) => s.rows.length);
        if (!valid.length) throw new Error("No valid sheet rows for XLSX");
        const wb = XLSX.utils.book_new();
        for (const sheet of valid) {
          const keyOrder: string[] = [];
          const seen = new Set<string>();
          sheet.rows.forEach((r) => {
            Object.keys(r).forEach((k) => {
              if (!seen.has(k)) {
                seen.add(k);
                keyOrder.push(k);
              }
            });
          });
          const dataMatrix = [
            keyOrder,
            ...sheet.rows.map((r) =>
              keyOrder.map((k) => {
                const v = (r as Record<string, unknown>)[k];
                if (v === null || v === undefined) return "";
                if (typeof v === "object") return JSON.stringify(v);
                return v as unknown;
              })
            ),
          ];
          const ws = XLSX.utils.aoa_to_sheet(dataMatrix);
          const safe =
            sheet.name.replace(/[^A-Za-z0-9-_]+/g, "_").slice(0, 31) || "Sheet";
          XLSX.utils.book_append_sheet(wb, ws, safe);
        }
        const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `workbook_export_${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        push({
          title: "XLSX Exported",
          description: `Workbook exported after retry`,
          variant: "success",
        });
        return;
      } catch (retryErr: unknown) {
        const msg =
          retryErr instanceof Error
            ? retryErr.message
            : e instanceof Error
              ? e.message
              : "XLSX export failed";
        push({
          title: "Export Failed",
          description: `XLSX load failed: ${msg}. Try again or reload page.`,
          variant: "error",
        });
      }
    }
  }

  // Resilient SheetJS dynamic importer with fallback paths & cache
  // Typed to avoid "any" while accommodating differing build entrypoints.
  type SheetJSType = typeof import("xlsx");
  const sheetJsRef = useRef<SheetJSType | null>(null);
  const attemptedOnceRef = useRef<boolean>(false);
  const getXLSX = useCallback(
    async (forceAlternate = false): Promise<SheetJSType> => {
      if (sheetJsRef.current) return sheetJsRef.current;
      const strategies: Array<() => Promise<unknown>> = forceAlternate
        ? [
            () => import("xlsx/xlsx.mjs"),
            () => import("xlsx/dist/xlsx.full.min.js"),
            () => import("xlsx"),
          ]
        : [
            () => import("xlsx"),
            () => import("xlsx/xlsx.mjs"),
            () => import("xlsx/dist/xlsx.full.min.js"),
          ];
      let lastErr: unknown;
      for (const load of strategies) {
        try {
          const mod = await load();
          const anyMod = mod as any; // eslint-disable-line @typescript-eslint/no-explicit-any
          const resolved: SheetJSType =
            anyMod && anyMod.utils
              ? anyMod
              : anyMod?.default && anyMod.default.utils
                ? anyMod.default
                : anyMod;
          if (resolved && resolved.utils) {
            sheetJsRef.current = resolved;
            return resolved;
          }
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr instanceof Error
        ? lastErr
        : new Error("Unable to load SheetJS");
    },
    []
  );

  // Idle prefetch once workbook detected to reduce user-perceived latency & surface early chunk errors
  useEffect(() => {
    if (!workbookSheets || attemptedOnceRef.current) return;
    attemptedOnceRef.current = true;
    const t = setTimeout(() => {
      getXLSX().catch(() => {
        /* silently ignore */
      });
    }, 800);
    return () => clearTimeout(t);
  }, [workbookSheets, getXLSX]);

  function minifyJson() {
    try {
      const parsed = result?.parsed ?? JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setResult((prev) =>
        prev
          ? { ...prev, formatted: minified, raw: prev.raw }
          : { raw: input, formatted: minified, parsed }
      );
      pushHistory({ raw: result?.raw ?? input, formatted: minified, parsed });
      push({
        title: "Minified",
        description: "JSON minified (whitespace removed)",
        variant: "success",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Minify failed";
      push({ title: "Minify Error", description: message, variant: "error" });
    }
  }

  function downloadJson() {
    if (!result?.formatted) return;
    const blob = new Blob([result.formatted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
    push({
      title: "Download",
      description: "JSON file downloaded",
      variant: "success",
    });
  }

  // Tree helpers
  function toggle(path: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }
  function collapseAll() {
    if (!result?.parsed) return;
    // naive approach: just expand everything first by clearing, then add all composite paths
    const all = new Set<string>();
    const walk = (v: unknown, path: string) => {
      if (v && typeof v === "object") {
        all.add(path);
        if (Array.isArray(v)) {
          v.forEach((item, i) => walk(item, path ? `${path}.${i}` : String(i)));
        } else {
          Object.entries(v as Record<string, unknown>).forEach(([k, val]) =>
            walk(val, path ? `${path}.${k}` : k)
          );
        }
      }
    };
    walk(result.parsed, "root");
    setCollapsed(all);
  }
  function expandAll() {
    setCollapsed(new Set());
  }

  function collapseToDepth(limit: number) {
    if (!result?.parsed) return;
    if (limit < 0) {
      setCollapsed(new Set());
      return;
    }
    const coll = new Set<string>();
    const walk = (v: unknown, path: string, depth: number) => {
      if (v && typeof v === "object") {
        if (depth >= limit) {
          coll.add(path);
          return; // don't recurse deeper
        }
        if (Array.isArray(v)) {
          v.forEach((item, i) =>
            walk(item, path ? `${path}.${i}` : String(i), depth + 1)
          );
        } else {
          Object.entries(v as Record<string, unknown>).forEach(([k, val]) =>
            walk(val, path ? `${path}.${k}` : k, depth + 1)
          );
        }
      }
    };
    walk(result.parsed, "root", 0);
    setCollapsed(coll);
  }

  // --- Renderer Abstraction (Virtualization implementation - Issue #19) ---
  // Two renderer implementations: static (recursive) and virtualized (windowed)
  interface JsonTreeRenderer {
    renderRoot(value: unknown): React.ReactNode;
  }

  // Toggle between static and virtualized rendering based on dataset size and user preference
  const [useVirtualization, setUseVirtualization] = useState<boolean>(false);

  function renderNode(
    value: unknown,
    path: string,
    keyName?: string,
    depth = 0
  ): React.ReactNode {
    // Performance mode truncation: limit number of rendered composite nodes
    // We'll track via a closure counter.
    const isArr = Array.isArray(value);
    const isObj = !!value && typeof value === "object" && !isArr;
    const composite = isObj || isArr;
    const displayKey =
      keyName !== undefined ? (
        <span className="text-sky-600 dark:text-sky-400">{keyName}</span>
      ) : null;
    const indent = { paddingLeft: depth * 12 } as const;
    const isMatch = matchPaths.includes(path);
    const isSelected = selectedPath === path;
    const baseClasses = `leading-5 ${isMatch ? "bg-yellow-300/30 dark:bg-yellow-600/20" : ""} ${isSelected ? "ring-1 ring-primary/60 rounded-sm" : ""}`;

    if (!composite) {
      let display: string;
      if (typeof value === "string") display = '"' + value + '"';
      else if (value === null) display = "null";
      else display = String(value);
      const isEditing = editPath === path;
      return (
        <div
          key={path}
          style={indent}
          className={baseClasses + " cursor-pointer"}
          onClick={() => setSelectedPath(path)}
          onDoubleClick={() => {
            if (typeof value !== "object") {
              setEditPath(path);
              // store raw without added quotes for strings
              if (typeof value === "string") setEditValue(value);
              else if (value === null) setEditValue("null");
              else setEditValue(String(value));
            }
          }}
        >
          {displayKey && <>{displayKey}: </>}
          {!isEditing && <span className="text-foreground">{display}</span>}
          {isEditing && (
            <span className="inline-flex items-center gap-1">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="border rounded px-1 py-0.5 text-[11px] bg-background w-40"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyEdit();
                  if (e.key === "Escape") {
                    setEditPath(null);
                    setEditValue("");
                  }
                }}
              />
              <button
                onClick={applyEdit}
                className="rounded border px-1 py-0.5 text-[10px]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditPath(null);
                  setEditValue("");
                }}
                className="rounded border px-1 py-0.5 text-[10px]"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      );
    }

    const collapsedHere = collapsed.has(path);
    const size = isArr
      ? (value as unknown[]).length
      : Object.keys(value as object).length;

    let childEntries: [string, unknown][] = [];
    if (isObj) {
      childEntries = Object.entries(value as Record<string, unknown>);
      if (sortKeys)
        childEntries = [...childEntries].sort((a, b) =>
          a[0].localeCompare(b[0])
        );
    }

    return (
      <div
        key={path}
        style={indent}
        className={baseClasses + " cursor-pointer"}
        onClick={() => setSelectedPath(path)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(path);
          }}
          className="mr-1 inline-flex items-center justify-center w-4 text-xs select-none"
          aria-label={collapsedHere ? "Expand node" : "Collapse node"}
        >
          {collapsedHere ? "+" : "-"}
        </button>
        {displayKey && <>{displayKey}: </>}
        <span className="text-purple-600 dark:text-purple-400">
          {isArr ? `Array(${size})` : "Object"}
        </span>
        {!collapsedHere && (
          <div className="mt-1">
            {isArr &&
              (value as unknown[]).map((v, i) => (
                <div key={path + "." + i}>
                  {renderNode(v, path + "." + i, String(i), depth + 1)}
                </div>
              ))}
            {isObj &&
              childEntries.map(([k, v]) => (
                <div key={path + "." + k}>
                  {renderNode(v, path + "." + k, k, depth + 1)}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  // Wrapper component to apply performance cap while reusing existing renderNode
  const RenderTreeRoot: React.FC<{
    value: unknown;
    renderNode: typeof renderNode;
    perfMode: boolean;
  }> = ({ value, renderNode, perfMode }) => {
    const MAX_NODES = 5000; // soft cap
    if (!perfMode) return <>{renderNode(value, "root", "root")}</>;
    // We perform a shallow traversal counting nodes; if exceeding cap, render truncated message.
    let count = 0;
    const walkCount = (v: unknown) => {
      count++;
      if (count > MAX_NODES) return;
      if (v && typeof v === "object") {
        if (Array.isArray(v)) v.forEach(walkCount);
        else Object.values(v as Record<string, unknown>).forEach(walkCount);
      }
    };
    walkCount(value);
    if (count <= MAX_NODES) return <>{renderNode(value, "root", "root")}</>;
    return (
      <div className="space-y-2">
        <div className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-400">
          Performance mode active: structure is very large ({">"}{" "}
          {MAX_NODES.toLocaleString()} nodes). Display truncated. Disable Perf
          Off to view full tree (may be slow).
        </div>
        {renderNode(value, "root", "root")}
      </div>
    );
  };

  function applyEdit() {
    if (!result?.parsed || editPath === null) return;
    // parse new primitive
    let newVal: unknown = editValue;
    const trimmed = editValue.trim();
    if (trimmed === "null") newVal = null;
    else if (trimmed === "true") newVal = true;
    else if (trimmed === "false") newVal = false;
    else if (trimmed === "") newVal = "";
    else if (!Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed))
      newVal = Number(trimmed);
    else {
      // treat as string (keep raw)
      newVal = editValue;
    }
    try {
      // clone current parsed to avoid mutation side-effects
      const rootCopy = structuredClone
        ? structuredClone(result.parsed)
        : JSON.parse(JSON.stringify(result.parsed));
      const parts = editPath.split(".").slice(1); // remove root
      let cur: any = rootCopy; // eslint-disable-line @typescript-eslint/no-explicit-any
      for (let i = 0; i < parts.length - 1; i++) {
        const seg = parts[i];
        if (Array.isArray(cur)) {
          const idx = Number(seg);
          if (Number.isNaN(idx) || !(idx in cur))
            throw new Error("Invalid path");
          cur = cur[idx];
        } else if (cur && typeof cur === "object") {
          cur = (cur as Record<string, unknown>)[seg];
        } else {
          throw new Error("Cannot traverse path");
        }
      }
      const last = parts[parts.length - 1];
      if (Array.isArray(cur)) {
        const idx = Number(last);
        if (Number.isNaN(idx)) throw new Error("Invalid array index");
        cur[idx] = newVal;
      } else if (cur && typeof cur === "object") {
        (cur as Record<string, unknown>)[last] = newVal;
      } else throw new Error("Invalid target for edit");

      const formatted = JSON.stringify(rootCopy, null, 2);
      setResult({ raw: result.raw, formatted, parsed: rootCopy });
      pushHistory({ raw: result.raw, formatted, parsed: rootCopy });
      setEditPath(null);
      setEditValue("");
      push({
        title: "Updated",
        description: "Value updated successfully",
        variant: "success",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Edit failed";
      push({ title: "Edit Error", description: msg, variant: "error" });
    }
  }

  const tableData = useMemo(() => {
    if (!result?.parsed) return null;
    if (!Array.isArray(result.parsed)) return null;
    const arr = result.parsed;
    if (!arr.every((r) => r && typeof r === "object" && !Array.isArray(r)))
      return null;
    const rows = arr as Record<string, unknown>[];
    const headers = Array.from(
      rows.reduce<Set<string>>((acc, r) => {
        Object.keys(r).forEach((k) => acc.add(k));
        return acc;
      }, new Set())
    );
    return { headers, rows };
  }, [result?.parsed]);

  const showTree: boolean =
    mode === "tree" && !!result?.parsed && !result?.error;

  // Find & Replace Implementation (Issue #20)
  const performReplace = useCallback(
    (replaceOne: boolean = false): void => {
      if (!result?.parsed || !replacePattern.trim()) {
        push({
          title: "Replace Error",
          description: "No pattern specified or invalid JSON",
          variant: "error",
        });
        return;
      }

      try {
        // Clone the current parsed data
        const rootCopy = structuredClone
          ? structuredClone(result.parsed)
          : JSON.parse(JSON.stringify(result.parsed));

        let replacementCount = 0;
        const MAX_REPLACEMENTS = 10000; // Safety limit

        // Create matcher function
        let matcher: (value: string) => boolean;
        let replacer: (value: string) => string;

        if (replaceModeRegex) {
          const regex = new RegExp(replacePattern, replaceFlags);
          matcher = (value: string) => regex.test(value);
          replacer = (value: string) => value.replace(regex, replaceValue);
        } else {
          const flags = replaceFlags.includes("i") ? "gi" : "g";
          const searchRegex = new RegExp(
            replacePattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            flags
          );
          matcher = (value: string) => searchRegex.test(value);
          replacer = (value: string) =>
            value.replace(searchRegex, replaceValue);
        }

        // Recursive replacement function
        function replaceInValue(val: unknown): unknown {
          if (replacementCount >= MAX_REPLACEMENTS) return val;

          if (typeof val === "string") {
            if (matcher(val)) {
              const newVal = replacer(val);
              if (newVal !== val) {
                replacementCount++;
                if (replaceOne && replacementCount === 1) {
                  return newVal;
                } else if (!replaceOne) {
                  return newVal;
                }
              }
            }
            return val;
          }

          if (typeof val === "number" || typeof val === "boolean") {
            const strVal = String(val);
            if (matcher(strVal)) {
              const newVal = replacer(strVal);
              if (newVal !== strVal) {
                replacementCount++;
                // Try to convert back to original type
                if (typeof val === "number") {
                  const num = Number(newVal);
                  if (!Number.isNaN(num)) {
                    if (replaceOne && replacementCount === 1) return num;
                    else if (!replaceOne) return num;
                  }
                } else if (typeof val === "boolean") {
                  if (newVal === "true") {
                    if (replaceOne && replacementCount === 1) return true;
                    else if (!replaceOne) return true;
                  } else if (newVal === "false") {
                    if (replaceOne && replacementCount === 1) return false;
                    else if (!replaceOne) return false;
                  }
                }
                // Fall back to string if conversion fails
                if (replaceOne && replacementCount === 1) return newVal;
                else if (!replaceOne) return newVal;
              }
            }
            return val;
          }

          if (val === null) {
            const nullStr = "null";
            if (matcher(nullStr)) {
              const newVal = replacer(nullStr);
              if (newVal !== nullStr) {
                replacementCount++;
                // Try to parse as JSON value
                try {
                  const parsed = JSON.parse(newVal);
                  if (replaceOne && replacementCount === 1) return parsed;
                  else if (!replaceOne) return parsed;
                } catch {
                  // Fall back to string
                  if (replaceOne && replacementCount === 1) return newVal;
                  else if (!replaceOne) return newVal;
                }
              }
            }
            return val;
          }

          if (Array.isArray(val)) {
            return val.map(replaceInValue);
          }

          if (val && typeof val === "object") {
            const result: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(
              val as Record<string, unknown>
            )) {
              result[key] = replaceInValue(value);
              if (replaceOne && replacementCount >= 1) break;
            }
            return result;
          }

          return val;
        }

        const newData = replaceInValue(rootCopy);
        const formatted = JSON.stringify(newData, null, 2);

        if (replacementCount === 0) {
          push({
            title: "No Replacements",
            description: "No matches found for the specified pattern",
            variant: "default",
          });
          return;
        }

        // Update the result and add to history
        const newResult = { raw: result.raw, formatted, parsed: newData };
        setResult(newResult);
        pushHistory(newResult);

        push({
          title: replaceOne ? "Replaced One" : "Replace All Complete",
          description: `${replacementCount} replacement${replacementCount !== 1 ? "s" : ""} made`,
          variant: "success",
        });
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Replace operation failed";
        push({
          title: "Replace Error",
          description: message,
          variant: "error",
        });
      }
    },
    [
      result,
      replacePattern,
      replaceModeRegex,
      replaceFlags,
      replaceValue,
      push,
      setResult,
      pushHistory,
    ]
  );

  // Preview replacements (dry run)
  const previewReplace = useCallback((): void => {
    if (!result?.parsed || !replacePattern.trim()) return;

    try {
      let previewCount = 0;
      const previews: Array<{ path: string; old: string; new: string }> = [];
      const MAX_PREVIEWS = 20; // Limit preview items

      // Create matcher and replacer
      let matcher: (value: string) => boolean;
      let replacer: (value: string) => string;

      if (replaceModeRegex) {
        const regex = new RegExp(replacePattern, replaceFlags);
        matcher = (value: string) => regex.test(value);
        replacer = (value: string) => value.replace(regex, replaceValue);
      } else {
        const flags = replaceFlags.includes("i") ? "gi" : "g";
        const searchRegex = new RegExp(
          replacePattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          flags
        );
        matcher = (value: string) => searchRegex.test(value);
        replacer = (value: string) => value.replace(searchRegex, replaceValue);
      }

      // Walk the tree and collect preview data
      function walkForPreview(val: unknown, path: string): void {
        if (previewCount >= MAX_PREVIEWS) return;

        if (
          typeof val === "string" ||
          typeof val === "number" ||
          typeof val === "boolean" ||
          val === null
        ) {
          const strVal = val === null ? "null" : String(val);
          if (matcher(strVal)) {
            const newVal = replacer(strVal);
            if (newVal !== strVal) {
              previews.push({
                path: path.replace(/^root\.?/, "") || "root",
                old: strVal,
                new: newVal,
              });
              previewCount++;
            }
          }
        }

        if (Array.isArray(val)) {
          val.forEach((item, i) => {
            if (previewCount < MAX_PREVIEWS) {
              walkForPreview(item, `${path}.${i}`);
            }
          });
        } else if (val && typeof val === "object") {
          Object.entries(val as Record<string, unknown>).forEach(
            ([key, value]) => {
              if (previewCount < MAX_PREVIEWS) {
                walkForPreview(value, `${path}.${key}`);
              }
            }
          );
        }
      }

      walkForPreview(result.parsed, "root");

      if (previews.length === 0) {
        push({
          title: "Preview",
          description: "No matches found for replacement",
          variant: "default",
        });
        return;
      }

      // Show preview in console (in production, this could be a modal)
      console.group("🔍 Replace Preview");
      previews.forEach(({ path, old, new: newVal }, i) => {
        console.log(`${i + 1}. ${path}: "${old}" → "${newVal}"`);
      });
      if (previewCount >= MAX_PREVIEWS) {
        console.log(`... and ${replaceMatchCount - MAX_PREVIEWS} more matches`);
      }
      console.groupEnd();

      push({
        title: "Preview Generated",
        description: `${previews.length} replacement${previews.length !== 1 ? "s" : ""} previewed (check console)`,
        variant: "success",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Preview failed";
      push({
        title: "Preview Error",
        description: message,
        variant: "error",
      });
    }
  }, [
    result,
    replacePattern,
    replaceModeRegex,
    replaceFlags,
    replaceValue,
    replaceMatchCount,
    push,
  ]);

  // Additional keyboard shortcuts for find/replace
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (!(e.metaKey || e.ctrlKey)) return;

      if (e.key.toLowerCase() === "f" && showTree && !isTyping) {
        // Toggle Find & Replace panel
        e.preventDefault();
        setReplacePanelOpen((o) => !o);
      } else if (
        e.key.toLowerCase() === "h" &&
        showTree &&
        replacePanelOpen &&
        !isTyping
      ) {
        // Replace All (Cmd/Ctrl+H)
        if (
          replacePattern.trim() &&
          !replaceError &&
          result?.parsed &&
          replaceMatchCount > 0
        ) {
          e.preventDefault();
          performReplace(false);
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    showTree,
    replacePanelOpen,
    replacePattern,
    replaceError,
    result?.parsed,
    replaceMatchCount,
    performReplace,
  ]);
  useEffect(() => {
    if (!showTree || !result?.parsed || !replacePattern.trim()) {
      setReplaceMatchCount(0);
      setReplaceError("");
      return;
    }
    if (!replaceModeRegex) {
      const term = replaceFlags.includes("i")
        ? replacePattern.toLowerCase()
        : replacePattern;
      let count = 0;
      const walk = (val: unknown) => {
        if (
          typeof val === "string" ||
          typeof val === "number" ||
          typeof val === "boolean" ||
          val === null
        ) {
          const s = val === null ? "null" : String(val);
          const hay = replaceFlags.includes("i") ? s.toLowerCase() : s;
          if (hay.includes(term)) count++;
        }
        if (val && typeof val === "object") {
          if (Array.isArray(val)) val.forEach(walk);
          else Object.values(val as Record<string, unknown>).forEach(walk);
        }
      };
      walk(result.parsed);
      setReplaceMatchCount(count);
      setReplaceError("");
      return;
    }
    try {
      const re = new RegExp(replacePattern, replaceFlags);
      let count = 0;
      const walk = (val: unknown) => {
        if (
          typeof val === "string" ||
          typeof val === "number" ||
          typeof val === "boolean" ||
          val === null
        ) {
          const s = val === null ? "null" : String(val);
          if (re.test(s)) count++;
        }
        if (val && typeof val === "object") {
          if (Array.isArray(val)) val.forEach(walk);
          else Object.values(val as Record<string, unknown>).forEach(walk);
        }
      };
      walk(result.parsed);
      setReplaceMatchCount(count);
      setReplaceError("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Invalid regex";
      setReplaceError(msg);
      setReplaceMatchCount(0);
    }
  }, [
    replacePattern,
    replaceFlags,
    replaceModeRegex,
    result?.parsed,
    showTree,
  ]);

  // Search logic: build path index
  useEffect(() => {
    if (!showTree || !result?.parsed || !search.trim()) {
      setMatchPaths([]);
      setActiveMatchIndex(0);
      setSearchError("");
      return;
    }
    let matcher: (v: string) => boolean;
    if (searchMode === "regex") {
      try {
        const re = new RegExp(search, "i");
        matcher = (v: string) => re.test(v);
        setSearchError("");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Invalid regex";
        setSearchError(msg);
        setMatchPaths([]);
        return;
      }
    } else {
      const term = search.toLowerCase();
      matcher = (v: string) => v.toLowerCase().includes(term);
      setSearchError("");
    }
    const matches: string[] = [];
    const expandPaths: Set<string> = new Set();
    const walk = (val: unknown, p: string) => {
      let hit = false;
      if (val === null) hit = matcher("null");
      else if (typeof val === "string") hit = matcher(val);
      else if (typeof val === "number" || typeof val === "boolean")
        hit = matcher(String(val));
      if (p === "root") hit = false;
      if (hit) {
        matches.push(p);
        const parts = p.split(".");
        for (let i = 1; i < parts.length; i++) {
          expandPaths.add(parts.slice(0, i).join("."));
        }
      }
      if (val && typeof val === "object") {
        if (Array.isArray(val)) val.forEach((v, i) => walk(v, p + "." + i));
        else
          Object.entries(val as Record<string, unknown>).forEach(([k, v]) =>
            walk(v, p + "." + k)
          );
      }
    };
    walk(result.parsed, "root");
    // Expand ancestors of matches
    if (expandPaths.size) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        expandPaths.forEach((a) => next.delete(a));
        return next;
      });
    }
    setMatchPaths(matches);
    setActiveMatchIndex(0);
  }, [search, result?.parsed, showTree, searchMode]);

  function nextMatch(offset: number) {
    if (matchPaths.length === 0) return;
    setActiveMatchIndex(
      (i) => (i + offset + matchPaths.length) % matchPaths.length
    );
  }

  // Renderer implementations: static recursive and virtualized windowed
  const staticRenderer: JsonTreeRenderer = {
    renderRoot: (value: unknown) => (
      <RenderTreeRoot
        value={value}
        renderNode={renderNode}
        perfMode={perfMode}
      />
    ),
  };

  const virtualizedRenderer: JsonTreeRenderer = {
    renderRoot: (value: unknown) => (
      <VirtualizedJsonTree
        data={value}
        collapsed={collapsed}
        onToggle={toggle}
        searchTerm={search}
        searchMode={searchMode}
        matchPaths={matchPaths}
        activeMatchIndex={activeMatchIndex}
        selectedPath={selectedPath}
        onSelect={setSelectedPath}
        sortKeys={sortKeys}
        depthLimit={depthLimit}
        perfMode={perfMode}
        onEdit={(path, val) => {
          setEditPath(path);
          setEditValue(val);
        }}
        editPath={editPath}
        editValue={editValue}
        onEditChange={setEditValue}
        onEditSave={applyEdit}
        onEditCancel={() => {
          setEditPath(null);
          setEditValue("");
        }}
      />
    ),
  };

  // Auto-detect when to use virtualization based on dataset size
  const shouldUseVirtualization = useMemo(() => {
    if (!result?.parsed) return false;

    // Count total nodes to determine if virtualization is beneficial
    let nodeCount = 0;
    const countNodes = (val: unknown) => {
      nodeCount++;
      if (nodeCount > 3000) return; // Early exit for performance
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          val.forEach(countNodes);
        } else {
          Object.values(val as Record<string, unknown>).forEach(countNodes);
        }
      }
    };

    countNodes(result.parsed);

    // Use virtualization for datasets with >3000 nodes or when explicitly enabled
    return nodeCount > 3000 || useVirtualization;
  }, [result?.parsed, useVirtualization]);

  const activeRenderer: JsonTreeRenderer = shouldUseVirtualization
    ? virtualizedRenderer
    : staticRenderer;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold tracking-tight">JSON Tools</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-md overflow-hidden border">
            {(["text", "tree", "table"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 text-xs font-medium ${mode === m ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex rounded-md overflow-hidden border">
            <button
              onClick={undo}
              disabled={!(historyIndex > 0)}
              className={`px-2 py-1 text-xs font-medium disabled:opacity-40 ${historyIndex > 0 ? "hover:bg-muted" : ""}`}
              title="Undo (⌘/Ctrl+Z)"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={
                !(historyIndex >= 0 && historyIndex < history.length - 1)
              }
              className={`px-2 py-1 text-xs font-medium disabled:opacity-40 ${historyIndex >= 0 && historyIndex < history.length - 1 ? "hover:bg-muted" : ""}`}
              title="Redo (⌘/Ctrl+Shift+Z)"
            >
              Redo
            </button>
          </div>
          <Button onClick={formatJson} size="sm">
            Format
          </Button>
          <Button
            onClick={copyFormatted}
            disabled={!result?.formatted}
            size="sm"
            variant="outline"
          >
            Copy
          </Button>
          <Button onClick={exportCsv} size="sm" variant="secondary">
            JSON → CSV
          </Button>
          {workbookSheets && (
            <>
              <Button
                onClick={exportWorkbookZip}
                size="sm"
                variant="outline"
                title="Detects multi-sheet workbook patterns and exports each sheet as CSV inside a ZIP"
              >
                Export Sheets (ZIP)
              </Button>
              <Button
                onClick={exportWorkbookXlsx}
                size="sm"
                variant="outline"
                title="Export workbook as XLSX (SheetJS)"
              >
                Export XLSX
              </Button>
            </>
          )}
          <Button
            onClick={minifyJson}
            disabled={!result?.parsed}
            size="sm"
            variant="outline"
          >
            Minify
          </Button>
          <Button
            onClick={downloadJson}
            disabled={!result?.formatted}
            size="sm"
            variant="outline"
          >
            Download
          </Button>
          {showTree ? (
            <div className="flex gap-1 items-center">
              <Button
                onClick={expandAll}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Expand All
              </Button>
              <Button
                onClick={collapseAll}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Collapse All
              </Button>
              <Button
                onClick={() => setSortKeys((s) => !s)}
                size="sm"
                variant={sortKeys ? "default" : "outline"}
                className="h-7 px-2 text-xs"
              >
                {sortKeys ? "Unsort Keys" : "Sort Keys"}
              </Button>
              <div className="flex items-center gap-1 text-[10px] ml-1">
                <span className="text-muted-foreground">Depth</span>
                <select
                  value={depthLimit === null ? "" : depthLimit}
                  onChange={(e) => {
                    const v =
                      e.target.value === "" ? null : Number(e.target.value);
                    setDepthLimit(v);
                    if (v === null) {
                      // reset collapse state
                      setCollapsed(new Set());
                    } else {
                      collapseToDepth(v);
                    }
                  }}
                  className="border rounded px-1 py-0.5 bg-background"
                >
                  <option value="">All</option>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => setPerfMode((p) => !p)}
                size="sm"
                variant={perfMode ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                title="Performance mode caps rendered nodes for very large JSON"
              >
                {perfMode ? "Perf On" : "Perf Off"}
              </Button>
              <Button
                onClick={() => setUseVirtualization((v) => !v)}
                size="sm"
                variant={useVirtualization ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                title="Virtualization improves performance for large datasets by rendering only visible nodes"
              >
                {useVirtualization ? "Virtual" : "Static"}
              </Button>
              {shouldUseVirtualization && !useVirtualization && (
                <span
                  className="text-xs text-amber-600 dark:text-amber-400"
                  title="Large dataset detected - virtualization recommended"
                >
                  Auto-Virtual Recommended
                </span>
              )}
            </div>
          ) : null}
          {showTree && (
            <Button
              onClick={() => setReplacePanelOpen((o) => !o)}
              size="sm"
              variant={replacePanelOpen ? "default" : "outline"}
              className="h-7 px-2 text-xs"
            >
              {replacePanelOpen ? "Hide Replace" : "Find & Replace"}
            </Button>
          )}
        </div>
      </div>
      {showTree && (
        <div className="flex items-center gap-2 text-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-56 rounded-md border bg-background px-2 py-1"
          />
          {search && (
            <>
              <span className="text-muted-foreground">
                {matchPaths.length} match{matchPaths.length !== 1 && "es"}
              </span>
              <Button
                disabled={!matchPaths.length}
                onClick={() => nextMatch(-1)}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Prev
              </Button>
              <Button
                disabled={!matchPaths.length}
                onClick={() => nextMatch(1)}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Next
              </Button>
              {matchPaths.length > 0 && (
                <span className="text-muted-foreground">
                  {activeMatchIndex + 1}/{matchPaths.length}
                </span>
              )}
            </>
          )}
          <Button
            onClick={() =>
              setSearchMode((m) => (m === "plain" ? "regex" : "plain"))
            }
            size="sm"
            variant={searchMode === "regex" ? "default" : "outline"}
            className="h-7 px-2 text-xs"
          >
            {searchMode === "regex" ? "Regex" : "Plain"}
          </Button>
          {searchError && (
            <span
              className="text-red-600 dark:text-red-400 text-[10px]"
              title={searchError}
            >
              Regex Error
            </span>
          )}
          {selectedPath && (
            <div className="flex items-center gap-1">
              <span
                className="text-muted-foreground truncate max-w-[180px]"
                title={selectedPath}
              >
                Selected: {selectedPath.replace(/^root\.?/, "")}
              </span>
              <Button
                onClick={() => {
                  const pathToCopy = selectedPath.replace(/^root\.?/, "");
                  navigator.clipboard.writeText(pathToCopy || "root");
                  push({
                    title: "Copied",
                    description: "Path copied to clipboard",
                    variant: "success",
                  });
                }}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Copy Path
              </Button>
              <Button
                onClick={() => {
                  // Convert to JSON Pointer (RFC6901)
                  // root.a.b.0 -> /a/b/0
                  const rel = selectedPath.replace(/^root\.?/, "");
                  if (!rel) {
                    navigator.clipboard.writeText("");
                    push({
                      title: "Copied",
                      description: "Root pointer copied",
                      variant: "success",
                    });
                    return;
                  }
                  const pointer =
                    "/" +
                    rel
                      .split(".")
                      .map((seg) =>
                        seg.replace(/~/g, "~0").replace(/\//g, "~1")
                      )
                      .join("/");
                  navigator.clipboard.writeText(pointer);
                  push({
                    title: "Copied",
                    description: "JSON Pointer copied",
                    variant: "success",
                  });
                }}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Copy Pointer
              </Button>
              <Button
                onClick={() => {
                  if (!result?.parsed) return;
                  const parts = selectedPath.split(".").slice(1); // remove synthetic root
                  let cur: unknown = result.parsed as unknown;
                  for (const part of parts) {
                    if (part === "") continue;
                    if (cur === null || cur === undefined) break;
                    if (typeof cur === "object") {
                      if (Array.isArray(cur)) {
                        const idx = Number(part);
                        if (!Number.isNaN(idx)) cur = (cur as unknown[])[idx];
                        else {
                          cur = undefined;
                          break;
                        }
                      } else {
                        cur = (cur as Record<string, unknown>)[part];
                      }
                    } else {
                      cur = undefined;
                      break;
                    }
                  }
                  const valStr =
                    typeof cur === "object"
                      ? JSON.stringify(cur)
                      : String(cur ?? "");
                  navigator.clipboard.writeText(valStr);
                  push({
                    title: "Copied",
                    description: "Value copied to clipboard",
                    variant: "success",
                  });
                }}
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
              >
                Copy Value
              </Button>
            </div>
          )}
        </div>
      )}
      {showTree && replacePanelOpen && (
        <div className="rounded-md border bg-muted/40 p-3 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium">Pattern</label>
              <input
                value={replacePattern}
                onChange={(e) => setReplacePattern(e.target.value)}
                className="rounded border bg-background px-2 py-1 text-xs w-56"
                placeholder={replaceModeRegex ? "regex e.g. foo.*bar" : "text"}
              />
            </div>
            {replaceModeRegex && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium">Flags</label>
                <input
                  value={replaceFlags}
                  onChange={(e) =>
                    setReplaceFlags(e.target.value.replace(/[^gimsuy]/g, ""))
                  }
                  className="rounded border bg-background px-2 py-1 text-xs w-20"
                  placeholder="flags"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium">Replacement</label>
              <input
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                className="rounded border bg-background px-2 py-1 text-xs w-56"
                placeholder="replacement text"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium">Mode</label>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-[11px]"
                onClick={() => {
                  setReplaceModeRegex((r) => !r);
                  setReplaceError("");
                }}
              >
                {replaceModeRegex ? "Regex" : "Plain"}
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium">Matches</label>
              <div className="text-xs h-8 flex items-center px-2 border rounded bg-background">
                {replaceError ? "—" : replaceMatchCount}
              </div>
            </div>
            <div className="flex gap-2 items-center ml-auto">
              <Button
                size="sm"
                variant="outline"
                disabled={
                  !replacePattern.trim() || !!replaceError || !result?.parsed
                }
                className="h-8 px-3 text-[11px]"
                onClick={previewReplace}
                title="Preview replacements in console"
              >
                Preview
              </Button>
              <Button
                size="sm"
                disabled={
                  !replacePattern.trim() ||
                  !!replaceError ||
                  !result?.parsed ||
                  replaceMatchCount === 0
                }
                className="h-8 px-3 text-[11px]"
                onClick={() => performReplace(true)}
                title="Replace the first match only"
              >
                Replace One
              </Button>
              <Button
                size="sm"
                disabled={
                  !replacePattern.trim() ||
                  !!replaceError ||
                  !result?.parsed ||
                  replaceMatchCount === 0
                }
                className="h-8 px-3 text-[11px]"
                onClick={() => performReplace(false)}
                title="Replace all matches"
              >
                Replace All
              </Button>
            </div>
          </div>
          {replaceError && (
            <p className="text-[10px] text-red-600 dark:text-red-400">
              {replaceError}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Find & Replace supports both plain text and regex patterns. Use
            Preview to see changes before applying. All replacements are added
            as a single undo step for easy rollback.
          </p>
        </div>
      )}
      {showTree && nodeCount > LARGE_THRESHOLD && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2 text-[11px] leading-snug text-yellow-700 dark:text-yellow-400">
          Large JSON detected (~{nodeCount.toLocaleString()} nodes).
          Auto-expansion is limited; consider searching or sorting selectively
          for performance.
        </div>
      )}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste JSON here..."
        className="w-full h-80 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:ring focus-visible:ring-primary/30"
      />
      {result?.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">
          {result.error}
        </div>
      )}
      {!result?.error && mode === "text" && result?.formatted && (
        <pre className="rounded-md border bg-muted p-3 text-xs max-h-96 overflow-auto font-mono whitespace-pre">
          {result.formatted}
        </pre>
      )}
      {showTree && (
        <div className="rounded-md border bg-muted/40 p-3 text-xs max-h-96 overflow-auto font-mono">
          {result?.parsed
            ? activeRenderer.renderRoot(result.parsed as unknown)
            : null}
        </div>
      )}
      {mode === "table" &&
        (tableData ? (
          <div className="rounded-md border overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>
                  {tableData.headers.map((h) => (
                    <th key={h} className="px-2 py-1 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((r, i) => (
                  <tr key={i} className="odd:bg-muted/30">
                    {tableData.headers.map((h) => {
                      const v = r[h];
                      let cell: string;
                      if (v === null || v === undefined) cell = "";
                      else if (typeof v === "object")
                        cell = JSON.stringify(v).slice(0, 120);
                      else cell = String(v);
                      return (
                        <td
                          key={h}
                          className="px-2 py-1 align-top"
                          title={
                            typeof v === "object"
                              ? JSON.stringify(v)
                              : undefined
                          }
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Table view requires an array of plain objects.
          </div>
        ))}
      <p className="text-[10px] text-muted-foreground">
        Modes: Text (raw pretty JSON), Tree (expand/collapse nodes), Table
        (array of objects). Large payloads may be slower – consider trimming
        before formatting.
      </p>
      {showTree && (
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border/60">
          <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={persistHistory}
              onChange={(e) => setPersistHistory(e.target.checked)}
              className="accent-primary"
            />
            Persist History (exp)
          </label>
          {persistHistory && history.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[10px]"
              onClick={() => {
                setHistory([]);
                setHistoryIndex(-1);
                setResult(null);
                setHistorySizeWarning("");
                try {
                  localStorage.removeItem(HISTORY_KEY);
                } catch {}
              }}
              title="Clear persisted history"
            >
              Clear
            </Button>
          )}
        </div>
      )}
      {historySizeWarning && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          {historySizeWarning}
        </p>
      )}
    </div>
  );
}
