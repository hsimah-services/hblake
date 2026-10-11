import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Page } from './Page';
import QUERY_NODE, { type PageQuery } from './__generated__/PageQuery.graphql';
import { PageRouteQuery, type PageEntryPointParams } from '../../routes/__generated__/routes';

export function PageEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Page, { queryRef: queries.content }); }

export const PAGE_ENTRY_POINT: RouteEntryPoint<PageEntryPointParams, Queries> = {
  root: resource('Page', PageEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: PageRouteQuery.getVariables(route.input) } } }),
};

type Queries = { content: PageQuery };
