import { Button } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router';

export function SearchButton() {
  return (
    <Button asChild size="2" radius="full" style={{ boxShadow: 'var(--shadow-3)' }}>
      <Link to="/search" aria-label="Search flights">
        <MagnifyingGlassIcon />
        Search
      </Link>
    </Button>
  );
}
