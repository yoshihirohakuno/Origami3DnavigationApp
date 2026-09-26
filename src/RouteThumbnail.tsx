import { memo, useEffect, useRef, useState, type ReactElement } from 'react';

/** Large modular routes must not paint every hidden SVG (including the
 * desktop/mobile duplicate) up front or on each animation frame. */
export const RouteThumbnail = memo(function RouteThumbnail({ children }: { children: ReactElement }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={ref} aria-hidden="true" style={{ display: 'inline-flex', width: 44, height: 44, flexShrink: 0 }}>
    {visible ? children : null}
  </span>;
});
