import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { PageItem } from './PageItem';
import QUERY_NODE, { type PageItemQuery } from './__generated__/PageItemQuery.graphql';
import { PageItemRouteQuery, type PageItemEntryPointParams } from '../../routes/__generated__/routes';

export function PageItemEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(PageItem, { queryRef: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const PAGE_ITEM_ENTRY_POINT: RouteEntryPoint<PageItemEntryPointParams, Queries> = {
  root: resource('PageItem', PageItemEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: PageItemRouteQuery.getVariables(route.input) } } }),
};

type Queries = { content: PageItemQuery };
