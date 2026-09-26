import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

type Snap = 'peek' | 'full';

interface BottomSheetProps {
  header: ReactNode;
  children: ReactNode;
  onClose: () => void;
  // How much of the sheet is visible in its collapsed state, in px.
  peekHeight?: number;
}

const DISMISS_THRESHOLD_PX = 80;
const FLICK_VELOCITY = 0.5; // px per ms

// On phones this is a draggable sheet that peeks up from the bottom and expands to show more; on
// wider screens CSS turns it into a static floating side panel and dragging is disabled.
export function BottomSheet({ header, children, onClose, peekHeight = 200 }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number } | null>(null);
  const [snap, setSnap] = useState<Snap>('peek');
  const [dragOffset, setDragOffset] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSheetHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
    });
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  const peekTranslate = Math.max(0, sheetHeight - peekHeight);
  const baseTranslate = snap === 'full' ? 0 : peekTranslate;
  const translate = Math.max(0, baseTranslate + dragOffset);

  const isDraggable = () => window.matchMedia('(max-width: 767px)').matches;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggable() || (event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startTime: performance.now() };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) setDragOffset(event.clientY - drag.current.startY);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const offset = event.clientY - drag.current.startY;
    const velocity = offset / Math.max(1, performance.now() - drag.current.startTime);
    drag.current = null;
    setDragOffset(0);

    // A tap on the handle toggles between states, like most native sheets.
    if (Math.abs(offset) < 5) {
      setSnap(snap === 'peek' ? 'full' : 'peek');
      return;
    }

    const position = baseTranslate + offset;
    if (snap === 'peek' && (offset > DISMISS_THRESHOLD_PX || velocity > FLICK_VELOCITY * 2)) {
      onClose();
    } else if (velocity < -FLICK_VELOCITY || position < peekTranslate / 2) {
      setSnap('full');
    } else {
      setSnap('peek');
    }
  };

  return (
    <div
      ref={sheetRef}
      className={styles.sheet}
      data-snap={snap}
      data-dragging={dragOffset !== 0 || undefined}
      style={{ '--sheet-translate': `${translate}px` } as React.CSSProperties}
      role="dialog"
      aria-modal="false"
    >
      <div
        className={styles.dragArea}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.handle} aria-hidden />
        {header}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
