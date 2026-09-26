import { Box, Grid, Skeleton, Text } from '@radix-ui/themes';

interface Stat {
  label: string;
  value: string;
}

interface StatGridProps {
  title: string;
  stats: Stat[];
  loading?: boolean;
}

export function StatGrid({ title, stats, loading = false }: StatGridProps) {
  return (
    <Box>
      <Text
        as="div"
        size="1"
        weight="medium"
        color="gray"
        mb="2"
        style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        {title}
      </Text>
      <Grid columns="2" gapX="4" gapY="3">
        {stats.map((stat) => (
          <Box key={stat.label}>
            <Text as="div" size="1" color="gray">
              {stat.label}
            </Text>
            <Skeleton loading={loading}>
              <Text
                as="div"
                size="3"
                weight="medium"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.value}
              </Text>
            </Skeleton>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
