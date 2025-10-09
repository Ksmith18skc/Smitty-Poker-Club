import { useCallback, useRef } from 'react';

interface UseDoubleTapOptions {
  onSingleTap?: () => void;
  onDoubleTap: () => void;
  delay?: number;
}

export function useDoubleTap({ onSingleTap, onDoubleTap, delay = 300 }: UseDoubleTapOptions) {
  const lastTap = useRef<number>(0);
  const tapTimeout = useRef<number>();

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    clearTimeout(tapTimeout.current);

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap detected
      onDoubleTap();
      lastTap.current = 0;
    } else {
      // First tap
      lastTap.current = now;
      if (onSingleTap) {
        tapTimeout.current = window.setTimeout(() => {
          onSingleTap();
          lastTap.current = 0;
        }, delay);
      }
    }
  }, [onSingleTap, onDoubleTap, delay]);

  return handleTap;
}