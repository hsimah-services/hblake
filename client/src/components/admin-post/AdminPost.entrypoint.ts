import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPost } from './AdminPost';
import { AdminPostQueryVariables } from './AdminPostQuery';
import QUERY_NODE, { type AdminPostQuery } from './__generated__/AdminPostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminPostEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminPost, { queryRef: queries.content }); }

export const ADMIN_POST_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminPost', AdminPostEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminPostQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminPostQuery };
type Empty = Record<string, never>;
