"use client";

import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

type ThumbRect = { x: number; y: number; width: number; height: number };

/**
 * Measures the item marked `data-thumb-key={activeKey}` inside `containerRef` (which must be positioned)
 * and keeps the rect in sync with resizes. Transitions switch on after the first placement so the
 * thumb does not slide in from the left edge on load.
 */
export function useLiquidThumb(containerRef: RefObject<HTMLElement | null>, activeKey: string | undefined) {
  const [rect, setRect] = useState<ThumbRect | null>(null);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const target = activeKey
        ? container.querySelector<HTMLElement>(`[data-thumb-key="${CSS.escape(activeKey)}"]`)
        : null;
      // Hidden copies (display: none) measure 0×0; treat them as unmeasured so the thumb reappears in place.
      setRect(
        target?.offsetWidth
          ? { x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight }
          : null,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, activeKey]);

  useEffect(() => {
    if (!rect || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [rect, animate]);

  const [moving, setMoving] = useState(false);
  const previousKey = useRef(activeKey);

  useEffect(() => {
    if (previousKey.current === activeKey) return;
    previousKey.current = activeKey;
    if (!animate) return;
    setMoving(true);
    const timer = window.setTimeout(() => setMoving(false), 260);
    return () => window.clearTimeout(timer);
  }, [activeKey, animate]);

  return { rect, animate, moving };
}

export function LiquidThumb({ rect, animate, moving }: { rect: ThumbRect | null; animate: boolean; moving: boolean }) {
  if (!rect) return null;
  return (
    <span
      aria-hidden="true"
      data-animate={animate}
      data-moving={moving}
      className="liquid-thumb"
      style={{ translate: `${rect.x}px ${rect.y}px`, width: rect.width, height: rect.height }}
    />
  );
}
