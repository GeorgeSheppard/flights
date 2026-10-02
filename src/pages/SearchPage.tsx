import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Box,
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  IconButton,
  Skeleton,
  Text,
  TextField,
} from '@radix-ui/themes';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { isRateLimited } from '@/api/client';
import { SearchResultCard, type FindOnMap } from '@/features/search/SearchResultCard';
import { groupResults, type ResultGroup } from '@/features/search/groupResults';
import {
  isSearchUnavailable,
  normaliseFlightNumber,
  useFlightSearch,
} from '@/features/search/queries';
import styles from './SearchPage.module.css';

const QUERY_PARAM = 'q';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const flightNumber = normaliseFlightNumber(searchParams.get(QUERY_PARAM) ?? '');
  const [input, setInput] = useState(flightNumber);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = normaliseFlightNumber(input);
    setSearchParams(next ? { [QUERY_PARAM]: next } : {}, { replace: true });
    (document.activeElement as HTMLElement | null)?.blur();
  };

  // Go back to the map as it was if we came from it, otherwise (e.g. a shared link) open it fresh.
  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Container size="2" px="4">
          <form onSubmit={onSubmit} role="search">
            <Flex align="center" gap="3">
              <IconButton
                type="button"
                variant="ghost"
                color="gray"
                size="3"
                onClick={goBack}
                aria-label="Back to map"
              >
                <ArrowLeftIcon width={20} height={20} />
              </IconButton>
              <Box flexGrow="1">
                <TextField.Root
                  size="3"
                  radius="full"
                  placeholder="Flight number, e.g. BA123"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  autoFocus={!flightNumber}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  aria-label="Flight number"
                >
                  <TextField.Slot>
                    <MagnifyingGlassIcon height={16} width={16} />
                  </TextField.Slot>
                </TextField.Root>
              </Box>
            </Flex>
          </form>
        </Container>
      </header>

      <Container size="2" px="4" py="4">
        <SearchResults flightNumber={flightNumber} />
      </Container>
    </div>
  );
}

// A flight in the air is on the map. Of the upcoming ones, only the next has a chance of its plane
// being known yet, flying in to operate it.
function findOnMap(group: ResultGroup, index: number): FindOnMap | undefined {
  if (group.id === 'inTheAir') return 'flight';
  if (group.id === 'upcoming' && index === 0) return 'plane';
  return undefined;
}

function SearchResults({ flightNumber }: { flightNumber: string }) {
  const search = useFlightSearch(flightNumber);

  if (!flightNumber) {
    return (
      <Text as="p" color="gray" size="2" align="center" mt="6">
        Search for a flight by its number to see where it’s going and when.
      </Text>
    );
  }

  if (search.isPending) {
    return (
      <Flex direction="column" gap="3" aria-busy>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} height="148px" style={{ borderRadius: 'var(--radius-4)' }} />
        ))}
      </Flex>
    );
  }

  if (isSearchUnavailable(search.error)) {
    return (
      <Callout.Root color="gray" variant="surface">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>Flight search isn’t available yet. Check back soon.</Callout.Text>
      </Callout.Root>
    );
  }

  if (isRateLimited(search.error)) {
    return (
      <Callout.Root color="amber" role="alert">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>Too many searches right now. Try again in a minute.</Callout.Text>
        <Button size="1" variant="soft" color="amber" onClick={() => search.refetch()}>
          Try again
        </Button>
      </Callout.Root>
    );
  }

  if (search.isError) {
    return (
      <Callout.Root color="red" role="alert">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>
          Couldn’t search for {flightNumber}. {search.error.message}
        </Callout.Text>
        <Button size="1" variant="soft" color="red" onClick={() => search.refetch()}>
          Try again
        </Button>
      </Callout.Root>
    );
  }

  const groups = groupResults(search.data);
  if (groups.length === 0) {
    return (
      <Text as="p" color="gray" size="2" align="center" mt="6">
        No flights found for {flightNumber}.
      </Text>
    );
  }

  return (
    <Flex direction="column" gap="5">
      {groups.map((group) => (
        <Flex asChild direction="column" gap="3" key={group.title}>
          <section>
            <Heading as="h2" size="2" color="gray" weight="medium" className={styles.groupTitle}>
              {group.title}
            </Heading>
            {group.flights.map((flight, index) => (
              <SearchResultCard
                key={flight.faFlightId}
                flight={flight}
                findOnMap={findOnMap(group, index)}
              />
            ))}
          </section>
        </Flex>
      ))}
    </Flex>
  );
}
