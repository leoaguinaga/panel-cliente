'use client';

import { useRef } from 'react';

type DragState = { pointerId: number; startX: number; startY: number; startScrollLeft: number; dragging: boolean };

export function useHorizontalDragScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const headerProps = {
    onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
      const container = containerRef.current;
      if (!container || (e.pointerType === 'mouse' && e.button !== 0)) return;
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startScrollLeft: container.scrollLeft, dragging: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
      const container = containerRef.current; const drag = dragRef.current;
      if (!container || !drag || drag.pointerId !== e.pointerId) return;
      const deltaX = e.clientX - drag.startX; const deltaY = e.clientY - drag.startY;
      if (!drag.dragging) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          dragRef.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          return;
        }
        if (Math.abs(deltaX) <= 8 || Math.abs(deltaX) < Math.abs(deltaY)) return;
        drag.dragging = true;
      }
      e.preventDefault();
      container.scrollLeft = drag.startScrollLeft - deltaX;
    },
    onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    },
    onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    },
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const container = containerRef.current; if (!container) return;
    e.preventDefault();
    container.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * Math.max(container.clientWidth * 0.8, 280), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return { containerRef, headerProps, onKeyDown };
}
