import { useRef, useCallback } from 'react';

export function useStreaming() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStreaming = useCallback(
    (
      fullText: string,
      onChar: (partial: string, done: boolean) => void,
      speedMs = 8
    ) => {
      let index = 0;
      intervalRef.current = setInterval(() => {
        index++;
        const partial = fullText.slice(0, index);
        const done = index >= fullText.length;
        onChar(partial, done);
        if (done) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, speedMs);
    },
    []
  );

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { startStreaming, stopStreaming };
}
