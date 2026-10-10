import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Website } from '../website/Website';
import { WebsiteQueryVariables, type WebsiteQueryRoute } from '../website/WebsiteQuery';
import WEBSITE_QUERY_NODE, { type WebsiteQuery } from '../website/__generated__/WebsiteQuery.graphql';

export function AdminUserEntryPoint({ queries, extraProps }: EntryPointProps<Queries, Empty, Empty, WebsiteQueryRoute>) {
  return createElement(Website, { queryRef: queries.website, route: extraProps });
}

export const ADMIN_USER_ENTRY_POINT: RouteEntryPoint<WebsiteQueryRoute, Queries, Empty, Empty, WebsiteQueryRoute> = {
  root: resource('AdminUser', AdminUserEntryPoint),
  getPreloadProps: (route) => ({ queries: { website: { parameters: WEBSITE_QUERY_NODE, variables: WebsiteQueryVariables(route), options: { fetchPolicy: 'network-only' } } }, extraProps: route }),
};

type Queries = { website: WebsiteQuery };
type Empty = Record<string, never>;
