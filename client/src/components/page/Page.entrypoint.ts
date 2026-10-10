import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Page } from './Page';
import { PageQueryVariables } from './PageQuery';
import QUERY_NODE, { type PageQuery } from './__generated__/PageQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function PageEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Page, { queryRef: queries.content }); }

export const PAGE_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Page', PageEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: PageQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: PageQuery };
type Empty = Record<string, never>;
