import { formatAltitude, formatHeading, formatSpeed, formatVerticalRate } from './units';

describe('units', () => {
  it('formats altitude in metres, or as ground', () => {
    expect(formatAltitude(10668)).toBe('10,668 m');
    expect(formatAltitude(100, true)).toBe('Ground');
    expect(formatAltitude(null)).toBe('—');
  });

  it('formats speed in km/h', () => {
    expect(formatSpeed(231.5)).toBe('833 km/h');
    expect(formatSpeed(null)).toBe('—');
  });

  it('formats heading with a compass point', () => {
    expect(formatHeading(0)).toBe('0° N');
    expect(formatHeading(268)).toBe('268° W');
    expect(formatHeading(359)).toBe('359° N');
  });

  it('formats vertical rate, treating small rates as level', () => {
    expect(formatVerticalRate(10.16)).toBe('+10.2 m/s');
    expect(formatVerticalRate(-5.08)).toBe('−5.1 m/s');
    expect(formatVerticalRate(0.2)).toBe('Level');
  });
});
