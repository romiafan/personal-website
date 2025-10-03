"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";

// Types for the virtualized tree
export interface JsonTreeNode {
  id: string; // unique identifier for the node
  path: string; // json path (e.g., "root.users.0.name")
  value: unknown; // the actual value
  keyName?: string; // key name for object properties
  depth: number; // depth level for indentation
  isComposite: boolean; // true for objects/arrays
  size?: number; // size for arrays/objects
  isExpanded?: boolean; // expansion state for composite nodes
  isMatch?: boolean; // whether this node matches current search
  isSelected?: boolean; // whether this node is selected
}

interface VirtualizedJsonTreeProps {
  data: unknown;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  searchTerm?: string;
  searchMode?: "plain" | "regex";
  matchPaths?: string[];
  selectedPath?: string | null;
  activeMatchIndex?: number;
  onSelect?: (path: string) => void;
  sortKeys?: boolean;
  depthLimit?: number | null;
  perfMode?: boolean;
  onEdit?: (path: string, value: string) => void;
  editPath?: string | null;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditSave?: () => void;
  onEditCancel?: () => void;
}

// Constants for virtualization
const DEFAULT_NODE_HEIGHT = 24; // pixels
const OVERSCAN = 10; // number of items to render outside visible area
const CONTAINER_HEIGHT = 400; // max height of the virtual container

// Performance monitoring
interface PerformanceMetrics {
  nodeCount: number;
  flattenTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function VirtualizedJsonTree({
  data,
  collapsed,
  onToggle,
  searchTerm = "",
  searchMode = "plain",
  matchPaths = [],
  selectedPath = null,
  activeMatchIndex = 0,
  onSelect,
  sortKeys = false,
  depthLimit = null,
  perfMode = false,
  onEdit,
  editPath = null,
  editValue = "",
  onEditChange,
  onEditSave,
  onEditCancel,
}: VirtualizedJsonTreeProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten the JSON tree into a list of nodes for virtualization
  const flattenedNodes = useMemo(() => {
    const startTime = performance.now();
    const nodes: JsonTreeNode[] = [];

    function processNode(
      value: unknown,
      path: string,
      keyName?: string,
      depth = 0
    ): void {
      // Apply depth limit if specified
      if (depthLimit !== null && depth > depthLimit) {
        return;
      }

      const isArray = Array.isArray(value);
      const isObject = value !== null && typeof value === "object" && !isArray;
      const isComposite = isArray || isObject;

      const node: JsonTreeNode = {
        id: path,
        path,
        value,
        keyName,
        depth,
        isComposite,
        size: isComposite
          ? isArray
            ? value.length
            : Object.keys(value as object).length
          : undefined,
        isExpanded: !collapsed.has(path),
        isMatch: matchPaths.includes(path),
        isSelected: selectedPath === path,
      };

      nodes.push(node);

      // Only process children if node is expanded and composite
      if (isComposite && !collapsed.has(path)) {
        if (isArray) {
          (value as unknown[]).forEach((item, index) => {
            processNode(item, `${path}.${index}`, String(index), depth + 1);
          });
        } else if (isObject) {
          const entries = Object.entries(value as Record<string, unknown>);
          const sortedEntries = sortKeys
            ? entries.sort(([a], [b]) => a.localeCompare(b))
            : entries;

          sortedEntries.forEach(([key, val]) => {
            processNode(val, `${path}.${key}`, key, depth + 1);
          });
        }
      }
    }

    if (data !== undefined) {
      processNode(data, "root", "root", 0);
    }

    const flattenTime = performance.now() - startTime;

    // Update performance metrics
    const metrics: PerformanceMetrics = {
      nodeCount: nodes.length,
      flattenTime,
      renderTime: 0, // Will be updated during render
    };

    // Add memory usage if available
    if ("memory" in performance) {
      const memInfo = (performance as any).memory; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (memInfo) {
        metrics.memoryUsage = memInfo.usedJSHeapSize;
      }
    }

    setPerformanceMetrics(metrics);

    return nodes;
  }, [data, collapsed, sortKeys, depthLimit, matchPaths, selectedPath]);

  // Performance mode: limit number of nodes and implement progressive loading
  const visibleNodes = useMemo(() => {
    if (!perfMode) return flattenedNodes;

    const MAX_NODES = 5000;
    if (flattenedNodes.length <= MAX_NODES) return flattenedNodes;

    // Progressive loading: instead of hard truncation, prioritize expanded paths and matches
    const priorityNodes: JsonTreeNode[] = [];
    const regularNodes: JsonTreeNode[] = [];

    for (const node of flattenedNodes) {
      if (node.isMatch || node.isSelected || node.depth <= 2) {
        priorityNodes.push(node);
      } else {
        regularNodes.push(node);
      }
    }

    // Fill up to MAX_NODES with priority nodes first, then regular nodes
    const result = priorityNodes.slice(0, MAX_NODES);
    const remaining = MAX_NODES - result.length;

    if (remaining > 0) {
      result.push(...regularNodes.slice(0, remaining));
    }

    // Add truncation indicator if needed
    if (result.length < flattenedNodes.length) {
      result.push({
        id: "__truncated__",
        path: "__truncated__",
        value: `... ${flattenedNodes.length - result.length} more nodes (disable Perf Mode or expand less to view)`,
        depth: 0,
        isComposite: false,
        isMatch: false,
        isSelected: false,
      });
    }

    return result;
  }, [flattenedNodes, perfMode]);

  // Calculate visible range based on scroll position with adaptive overscan
  const visibleRange = useMemo(() => {
    const containerHeight = CONTAINER_HEIGHT;
    const startIndex = Math.floor(scrollTop / DEFAULT_NODE_HEIGHT);
    const endIndex = Math.min(
      visibleNodes.length - 1,
      Math.ceil((scrollTop + containerHeight) / DEFAULT_NODE_HEIGHT)
    );

    // Adaptive overscan: use more for smaller datasets, less for larger ones
    const adaptiveOverscan =
      visibleNodes.length > 10000
        ? 5
        : visibleNodes.length > 5000
          ? 8
          : OVERSCAN;

    return {
      start: Math.max(0, startIndex - adaptiveOverscan),
      end: Math.min(visibleNodes.length - 1, endIndex + adaptiveOverscan),
    };
  }, [scrollTop, visibleNodes.length]);

  // Get visible nodes for rendering
  const nodesToRender = useMemo(() => {
    return visibleNodes.slice(visibleRange.start, visibleRange.end + 1);
  }, [visibleNodes, visibleRange]);

  // Handle scroll events with throttling for performance
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;

      // Throttle scroll updates for large datasets
      if (visibleNodes.length > 10000) {
        // Use requestAnimationFrame to throttle updates
        requestAnimationFrame(() => {
          setScrollTop(newScrollTop);
        });
      } else {
        setScrollTop(newScrollTop);
      }
    },
    [visibleNodes.length]
  );

  // Scroll to a specific node (useful for search navigation)
  const scrollToNode = useCallback((nodeIndex: number) => {
    if (containerRef.current) {
      const targetScrollTop = nodeIndex * DEFAULT_NODE_HEIGHT;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, []);

  // Find node index by path
  const findNodeIndex = useCallback(
    (path: string) => {
      return visibleNodes.findIndex((node) => node.path === path);
    },
    [visibleNodes]
  );

  // Scroll to active match when it changes
  useEffect(() => {
    if (
      matchPaths.length > 0 &&
      activeMatchIndex >= 0 &&
      activeMatchIndex < matchPaths.length
    ) {
      const activePath = matchPaths[activeMatchIndex];
      const index = findNodeIndex(activePath);
      if (index >= 0) {
        scrollToNode(index);
      }
    }
  }, [activeMatchIndex, matchPaths, findNodeIndex, scrollToNode]);

  // Scroll to selected or matched node
  useEffect(() => {
    if (selectedPath) {
      const index = findNodeIndex(selectedPath);
      if (index >= 0) {
        scrollToNode(index);
      }
    }
  }, [selectedPath, findNodeIndex, scrollToNode]);

  // Render a single node
  const renderNode = useCallback(
    (node: JsonTreeNode) => {
      if (node.id === "__truncated__") {
        return (
          <div
            key={node.id}
            className="flex items-center py-1 px-2 text-amber-600 dark:text-amber-400 text-sm"
            style={{ paddingLeft: 12 }}
          >
            {node.value as string}
          </div>
        );
      }

      const {
        path,
        value,
        keyName,
        depth,
        isComposite,
        size,
        isExpanded,
        isMatch,
        isSelected,
      } = node;
      const indent = depth * 12;

      // Check if this is the active match
      const isActiveMatch =
        matchPaths.length > 0 &&
        activeMatchIndex >= 0 &&
        activeMatchIndex < matchPaths.length &&
        matchPaths[activeMatchIndex] === path;

      // Determine classes for highlighting
      const baseClasses = `flex items-center py-1 px-2 cursor-pointer leading-5 hover:bg-muted/50 ${
        isMatch
          ? isActiveMatch
            ? "bg-yellow-400/50 dark:bg-yellow-500/30"
            : "bg-yellow-300/30 dark:bg-yellow-600/20"
          : ""
      } ${isSelected ? "ring-1 ring-primary/60 rounded-sm bg-primary/10" : ""}`;

      const handleClick = () => {
        onSelect?.(path);
      };

      const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isComposite) {
          onToggle(path);
        }
      };

      const handleDoubleClick = () => {
        if (!isComposite && onEdit) {
          const rawValue =
            typeof value === "string"
              ? value
              : value === null
                ? "null"
                : String(value);
          onEdit(path, rawValue);
        }
      };

      // Display key name
      const displayKey = keyName ? (
        <span className="text-sky-600 dark:text-sky-400 mr-1">{keyName}:</span>
      ) : null;

      // Display value or type
      let displayValue: React.ReactNode;

      if (isComposite) {
        const typeLabel = Array.isArray(value) ? `Array(${size})` : "Object";
        displayValue = (
          <span className="text-purple-600 dark:text-purple-400">
            {typeLabel}
          </span>
        );
      } else {
        // Handle editing mode
        if (editPath === path) {
          return (
            <div
              key={path}
              className={baseClasses}
              style={{ paddingLeft: indent }}
            >
              {displayKey}
              <input
                value={editValue}
                onChange={(e) => onEditChange?.(e.target.value)}
                className="border rounded px-1 py-0.5 text-xs bg-background flex-1 mr-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSave?.();
                  if (e.key === "Escape") onEditCancel?.();
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs mr-1"
                onClick={onEditSave}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={onEditCancel}
              >
                Cancel
              </Button>
            </div>
          );
        }

        // Regular display mode
        let formattedValue: string;
        if (typeof value === "string") {
          formattedValue = `"${value}"`;
        } else if (value === null) {
          formattedValue = "null";
        } else {
          formattedValue = String(value);
        }

        displayValue = (
          <span className="text-foreground">{formattedValue}</span>
        );
      }

      return (
        <div
          key={path}
          className={baseClasses}
          style={{ paddingLeft: indent }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {isComposite && (
            <button
              onClick={handleToggle}
              className="mr-2 inline-flex items-center justify-center w-4 h-4 text-xs select-none hover:bg-muted rounded"
              aria-label={isExpanded ? "Collapse node" : "Expand node"}
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}
          {!isComposite && <div className="w-6" />}
          {displayKey}
          {displayValue}
        </div>
      );
    },
    [
      onSelect,
      onToggle,
      onEdit,
      editPath,
      editValue,
      onEditChange,
      onEditSave,
      onEditCancel,
      matchPaths,
      activeMatchIndex,
    ]
  );

  // Calculate total height for scrollbar
  const totalHeight = visibleNodes.length * DEFAULT_NODE_HEIGHT;

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Performance recommendations for large datasets */}
      {flattenedNodes.length > 10000 && !perfMode && (
        <div className="mb-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-700 dark:text-yellow-400">
          Large dataset detected ({flattenedNodes.length.toLocaleString()}{" "}
          nodes). Consider enabling Performance Mode for better scrolling
          performance.
          {flattenedNodes.length > 50000 && (
            <div className="mt-1 text-orange-600 dark:text-orange-400">
              ⚠️ Very large dataset: Consider filtering or limiting depth for
              optimal performance.
            </div>
          )}
        </div>
      )}

      {/* Memory warning for extremely large datasets */}
      {performanceMetrics?.memoryUsage &&
        performanceMetrics.memoryUsage > 100 * 1024 * 1024 && (
          <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-400">
            High memory usage detected (
            {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB).
            Consider enabling Performance Mode or reducing JSON size.
          </div>
        )}

      {/* Virtual container */}
      <div
        ref={containerRef}
        className="border rounded-md bg-muted/40 overflow-auto"
        style={{ height: CONTAINER_HEIGHT }}
        onScroll={handleScroll}
      >
        {/* Spacer for total height */}
        <div style={{ height: totalHeight, position: "relative" }}>
          {/* Rendered nodes */}
          <div
            style={{
              position: "absolute",
              top: visibleRange.start * DEFAULT_NODE_HEIGHT,
              width: "100%",
            }}
          >
            {nodesToRender.map((node) => renderNode(node))}
          </div>
        </div>
      </div>

      {/* Stats and Performance Metrics */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing {visibleRange.end - visibleRange.start + 1} of{" "}
          {visibleNodes.length} nodes
          {visibleNodes.length !== flattenedNodes.length && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              ({flattenedNodes.length - visibleNodes.length} truncated)
            </span>
          )}
        </div>

        {performanceMetrics && flattenedNodes.length > 1000 && (
          <div className="flex items-center gap-3 text-[10px]">
            <span title="Time to flatten JSON structure">
              Flatten: {performanceMetrics.flattenTime.toFixed(1)}ms
            </span>
            <span title="Total nodes in structure">
              Nodes: {performanceMetrics.nodeCount.toLocaleString()}
            </span>
            {performanceMetrics.memoryUsage && (
              <span title="JavaScript heap memory usage">
                Memory:{" "}
                {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export utility function to get all matching node indices for search navigation
export function getMatchingNodeIndices(
  nodes: JsonTreeNode[],
  searchTerm: string,
  isRegex: boolean = false
): number[] {
  if (!searchTerm.trim()) return [];

  const indices: number[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === "__truncated__") continue;

    let matches = false;

    if (isRegex) {
      try {
        const regex = new RegExp(searchTerm, "i");
        const searchValue = node.value === null ? "null" : String(node.value);
        matches = regex.test(searchValue);
      } catch {
        // Invalid regex, skip
        continue;
      }
    } else {
      const searchValue = (
        node.value === null ? "null" : String(node.value)
      ).toLowerCase();
      matches = searchValue.includes(searchTerm.toLowerCase());
    }

    if (matches) {
      indices.push(i);
    }
  }

  return indices;
}
