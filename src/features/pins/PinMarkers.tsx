import { Marker } from '@vis.gl/react-maplibre';
import { MapPinIcon } from '@/components/MapPinIcon';
import { useFlightMap } from '@/features/map/useFlightMap';
import { usePins } from './pinStore';
import styles from './PinMarkers.module.css';

// Rendered inside the map so pins move with it.
export function PinMarkers() {
  const pins = usePins();
  const map = useFlightMap();

  return pins.map((pin) => (
    <Marker key={pin.id} longitude={pin.longitude} latitude={pin.latitude} anchor="bottom">
      <button
        type="button"
        className={styles.pin}
        onClick={() => map.flyTo(pin)}
        aria-label={`Go to ${pin.name}`}
      >
        <span className={styles.label}>{pin.name}</span>
        <MapPinIcon className={styles.icon} aria-hidden />
      </button>
    </Marker>
  ));
}
