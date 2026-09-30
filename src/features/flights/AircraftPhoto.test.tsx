import { screen } from '@testing-library/react';
import { mockFetch, renderWithProviders } from '@/test/render';
import { AircraftPhoto } from './AircraftPhoto';

const photo = {
  url: 'https://t.plnspttrs.net/07900/1941042_570ca1c4b7_280.jpg',
  width: 420,
  height: 280,
  photographer: 'Gerrit Griem',
  link: 'https://www.planespotters.net/photo/1941042/g-euyp?utm_source=api',
};

describe('AircraftPhoto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the photo, crediting the photographer and linking to Planespotters', async () => {
    const fetchMock = mockFetch(Response.json({ photo }));

    renderWithProviders(<AircraftPhoto icao24="40697b" />);

    expect(await screen.findByRole('img', { name: 'Photo of this aircraft' })).toHaveAttribute(
      'src',
      photo.url
    );
    expect(screen.getByText(/Gerrit Griem/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planespotters.net' })).toHaveAttribute(
      'href',
      photo.link
    );

    const url = new URL(fetchMock.mock.calls[0]![0].url);
    expect(url.pathname).toBe('/flights/photo');
    expect(url.searchParams.get('icao24')).toBe('40697b');
  });

  it('shows nothing when the aircraft has no photo', async () => {
    const fetchMock = mockFetch(Response.json({ photo: null }));

    const { container } = renderWithProviders(<AircraftPhoto icao24="40697b" />);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(container.querySelector('img')).toBeNull());
    expect(screen.queryByText(/Planespotters/)).not.toBeInTheDocument();
  });
});
