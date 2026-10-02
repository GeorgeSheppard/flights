import { parseWatch, watchPathFor, type Watch } from './watch';

const watch: Watch = {
  flight: 'AFR1681',
  callsigns: ['AFR1680', 'AFR1681'],
  latitude: 51.47,
  longitude: -0.45,
  headingDegrees: 270,
  seenAt: '2026-10-02T06:50:00Z',
};

describe('watch', () => {
  it('round-trips through the URL', () => {
    const path = watchPathFor(watch);

    expect(path.startsWith('/?')).toBe(true);
    expect(parseWatch(new URLSearchParams(path.slice(1)))).toEqual(watch);
  });

  it('keeps a missing heading missing', () => {
    const path = watchPathFor({ ...watch, headingDegrees: null });

    expect(parseWatch(new URLSearchParams(path.slice(1)))?.headingDegrees).toBeNull();
  });

  it('normalises callsigns so they match what aircraft broadcast', () => {
    expect(
      parseWatch(new URLSearchParams(watchPathFor({ ...watch, callsigns: ['afr 1680'] }).slice(1)))
        ?.callsigns
    ).toEqual(['AFR1680']);
  });

  it('ignores incomplete watches', () => {
    expect(parseWatch(new URLSearchParams('?watch=AFR1681&for=AFR1680'))).toBeNull();
    expect(
      parseWatch(new URLSearchParams('?watch=AFR1681&for=AFR1680&at=x,y&seen=2026'))
    ).toBeNull();
    expect(parseWatch(new URLSearchParams('?flight=4ca7b3'))).toBeNull();
  });
});
