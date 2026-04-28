import { useEffect, useRef } from 'react';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface UseSwipeOptions {
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
  element?: React.RefObject<HTMLElement>;
}

export function useSwipe({ onSwipe, threshold = 50, element }: UseSwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const target = element?.current ?? window;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < threshold) return;

      if (absDx > absDy) {
        onSwipe(dx > 0 ? 'right' : 'left');
      } else {
        onSwipe(dy > 0 ? 'down' : 'up');
      }
    };

    (target as EventTarget).addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    (target as EventTarget).addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });

    return () => {
      (target as EventTarget).removeEventListener('touchstart', handleTouchStart as EventListener);
      (target as EventTarget).removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [onSwipe, threshold, element]);
}
