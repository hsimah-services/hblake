import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Home } from './Home';
import { HomeQueryVariables } from './HomeQuery';
import QUERY_NODE, { type HomeQuery } from './__generated__/HomeQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function HomeEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Home, { queryRef: queries.content }); }

export const HOME_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Home', HomeEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: HomeQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: HomeQuery };
type Empty = Record<string, never>;
