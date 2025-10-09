import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {
      // Ignore errors (browser might block autoplay)
    });
  }, []);

  return { playSound };
}