import type { Aircraft } from '@/api/types';
import { toFeatureCollection } from './aircraftLayer';

const aircraft: Aircraft = {
  icao24: '4ca7b3',
  callsign: 'BAW123',
  latitude: 51.47,
  longitude: -0.45,
  onGround: false,
  altitudeMeters: 3000,
  velocityMetersPerSecond: 150,
  headingDegrees: null,
  verticalRateMetersPerSecond: 0,
};

describe('toFeatureCollection', () => {
  it('converts aircraft to GeoJSON points, defaulting a missing heading to north', () => {
    expect(toFeatureCollection([aircraft]).features).toEqual([
      {
        type: 'Feature',
        id: '4ca7b3',
        geometry: { type: 'Point', coordinates: [-0.45, 51.47] },
        properties: {
          icao24: '4ca7b3',
          callsign: 'BAW123',
          heading: 0,
          onGround: false,
          stale: false,
        },
      },
    ]);
  });

  it('marks planes only shown where they were last seen', () => {
    expect(toFeatureCollection([{ ...aircraft, stale: true }]).features[0]!.properties.stale).toBe(
      true
    );
  });
});
