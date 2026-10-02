import { Marker } from '@vis.gl/react-maplibre';
import { PlaneIcon } from '@/components/PlaneIcon';
import { formatTime } from '@/lib/time';
import type { Watch } from './watch';
import styles from './WatchMarker.module.css';

// Rendered inside the map, where the watched plane was last seen.
export function WatchMarker({ watch }: { watch: Watch }) {
  return (
    <Marker longitude={watch.longitude} latitude={watch.latitude} anchor="center">
      <div className={styles.marker}>
        <PlaneIcon
          className={styles.icon}
          style={{ transform: `rotate(${watch.headingDegrees ?? 0}deg)` }}
          aria-hidden
        />
        <span className={styles.label}>Last seen {formatTime(watch.seenAt)}</span>
      </div>
    </Marker>
  );
}
