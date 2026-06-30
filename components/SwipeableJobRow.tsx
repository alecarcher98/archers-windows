"use client";

import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 72;
const MAX_DRAG = 110;

/**
 * Lightweight swipe-to-act wrapper for job rows — no gesture library, just
 * touch events. Locks onto whichever axis the finger moves first so a
 * horizontal swipe doesn't fight the page's vertical scroll.
 */
export function SwipeableJobRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel,
  leftLabel,
  disabled = false,
}: {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  disabled?: boolean;
}) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const axis = useRef<"x" | "y" | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const canSwipeRight = Boolean(onSwipeRight) && !disabled;
  const canSwipeLeft = Boolean(onSwipeLeft) && !disabled;
  const swipeable = canSwipeRight || canSwipeLeft;

  function reset() {
    setDx(0);
    setDragging(false);
    startX.current = null;
    startY.current = null;
    axis.current = null;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (!swipeable) return;
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    axis.current = null;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!swipeable || startX.current === null || startY.current === null) return;
    const t = e.touches[0];
    const deltaX = t.clientX - startX.current;
    const deltaY = t.clientY - startY.current;

    if (!axis.current) {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return;
      axis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }
    if (axis.current !== "x") return;

    // Committed to a horizontal swipe — stop the page scrolling under it.
    e.preventDefault();
    let next = deltaX;
    if (next > 0 && !canSwipeRight) next = 0;
    if (next < 0 && !canSwipeLeft) next = 0;
    setDx(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, next)));
  }

  function onTouchEnd() {
    if (axis.current === "x") {
      if (dx > SWIPE_THRESHOLD) onSwipeRight?.();
      else if (dx < -SWIPE_THRESHOLD) onSwipeLeft?.();
    }
    reset();
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {swipeable ? (
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <span
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition-opacity"
            style={{ opacity: dx > 28 ? 1 : 0 }}
          >
            {rightLabel}
          </span>
          <span
            className="rounded-full bg-amber-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition-opacity"
            style={{ opacity: dx < -28 ? 1 : 0 }}
          >
            {leftLabel}
          </span>
        </div>
      ) : null}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={reset}
        style={{
          transform: swipeable ? `translateX(${dx}px)` : undefined,
          transition: dragging ? "none" : "transform 0.2s ease-out",
          touchAction: swipeable ? "pan-y" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
