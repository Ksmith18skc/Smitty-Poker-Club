import { useMemo, useRef } from 'react';

interface Table {
  id: string;
  [key: string]: any;
}

export function useTableHandlers(
  tables: Table[],
  onHighlight: (id: string) => void,
  onSelect: (table: Table) => void
) {
  const lastTapTimeRef = useRef<Record<string, number>>({});
  const tapTimeoutRef = useRef<Record<string, number>>({});
  const DOUBLE_TAP_DELAY = 300;

  return useMemo(() => {
    const handlers: Record<string, () => void> = {};

    tables.forEach((table) => {
      handlers[table.id] = () => {
        const now = Date.now();
        const lastTap = lastTapTimeRef.current[table.id] || 0;
        const timeSinceLastTap = now - lastTap;

        // Clear any existing timeout for this table
        if (tapTimeoutRef.current[table.id]) {
          window.clearTimeout(tapTimeoutRef.current[table.id]);
        }

        if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
          // Double tap detected
          onSelect(table);
          lastTapTimeRef.current[table.id] = 0;
        } else {
          // First tap
          lastTapTimeRef.current[table.id] = now;
          tapTimeoutRef.current[table.id] = window.setTimeout(() => {
            onHighlight(table.id);
            lastTapTimeRef.current[table.id] = 0;
          }, DOUBLE_TAP_DELAY);
        }
      };
    });

    return handlers;
  }, [tables, onHighlight, onSelect]);
}