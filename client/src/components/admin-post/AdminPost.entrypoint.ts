import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPost } from './AdminPost';
import { AdminPostListQueryVariables } from './AdminPostListQuery';
import { AdminPostQueryVariables } from './AdminPostQuery';
import { AdminPostCreateQueryVariables } from './AdminPostCreateQuery';
import LIST_NODE, { type AdminPostListQuery } from './__generated__/AdminPostListQuery.graphql';
import QUERY_NODE, { type AdminPostQuery } from './__generated__/AdminPostQuery.graphql';
import CREATE_NODE, { type AdminPostCreateQuery } from './__generated__/AdminPostCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminPostEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminPost, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_POST_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminPost', AdminPostEntryPoint),
  getPreloadProps: route => ({ queries: route.mode === 'list'
    ? { list: { parameters: LIST_NODE, variables: AdminPostListQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
    : route.mode === 'create'
      ? { create: { parameters: CREATE_NODE, variables: AdminPostCreateQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: AdminPostQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminPostListQuery; create?: AdminPostCreateQuery; content?: AdminPostQuery };
type Empty = Record<string, never>;
