import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminUser } from './AdminUser';
import { AdminUserQueryVariables } from './AdminUserQuery';
import QUERY_NODE, { type AdminUserQuery } from './__generated__/AdminUserQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminUserEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminUser, { queryRef: queries.content }); }

export const ADMIN_USER_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminUser', AdminUserEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminUserQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminUserQuery };
type Empty = Record<string, never>;
