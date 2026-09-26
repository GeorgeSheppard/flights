import { Button } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router';

export function SearchButton() {
  return (
    <Button asChild size="3" radius="full" style={{ boxShadow: 'var(--shadow-3)' }}>
      <Link to="/search">
        <MagnifyingGlassIcon width={16} height={16} />
        Search flights
      </Link>
    </Button>
  );
}
