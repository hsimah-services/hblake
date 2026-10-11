import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Home } from './Home';
import QUERY_NODE, { type HomeQuery } from './__generated__/HomeQuery.graphql';
import { HomeRouteQuery, type HomeEntryPointParams } from '../../routes/__generated__/routes';

export function HomeEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Home, { queryRef: queries.content }); }

export const HOME_ENTRY_POINT: RouteEntryPoint<HomeEntryPointParams, Queries> = {
  root: resource('Home', HomeEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: HomeRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: HomeQuery };
