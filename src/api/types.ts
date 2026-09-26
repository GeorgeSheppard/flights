import type { paths } from './schema';

type AreaResponse = paths['/flights/area']['get']['responses'][200]['content']['application/json'];

export type AreaQuery = NonNullable<paths['/flights/area']['get']['parameters']['query']>;
export type Aircraft = AreaResponse['aircraft'][number];
export type FlightDetails =
  paths['/flights/details']['get']['responses'][200]['content']['application/json'];
export type FlightRoute = NonNullable<FlightDetails['route']>;
export type Airport = NonNullable<FlightRoute['origin']>;
export type FlightSearchResult =
  paths['/flights/search']['get']['responses'][200]['content']['application/json']['flights'][number];
