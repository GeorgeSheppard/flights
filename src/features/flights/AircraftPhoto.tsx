import { useState } from 'react';
import { AspectRatio, Box, Link, Skeleton, Text } from '@radix-ui/themes';
import { useAircraftPhoto } from './queries';

// Photos come from Planespotters.net, whose terms require crediting the photographer and linking
// back to the photo's page.
export function AircraftPhoto({ icao24 }: { icao24: string }) {
  const photo = useAircraftPhoto(icao24);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (photo.isPending) {
    return (
      <AspectRatio ratio={3 / 2}>
        <Skeleton width="100%" height="100%" />
      </AspectRatio>
    );
  }

  const data = photo.data;
  if (!data || data.url === failedUrl) return null;

  return (
    <Box>
      <Link href={data.link} target="_blank" rel="noopener noreferrer">
        <AspectRatio ratio={3 / 2}>
          <img
            src={data.url}
            alt="Photo of this aircraft"
            width={data.width}
            height={data.height}
            onError={() => setFailedUrl(data.url)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'var(--radius-3)',
              display: 'block',
            }}
          />
        </AspectRatio>
      </Link>
      <Text as="p" size="1" color="gray" mt="1">
        Photo © {data.photographer} ·{' '}
        <Link href={data.link} target="_blank" rel="noopener noreferrer" color="gray">
          Planespotters.net
        </Link>
      </Text>
    </Box>
  );
}
