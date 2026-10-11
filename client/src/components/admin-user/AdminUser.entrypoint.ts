import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminUser } from './AdminUser';
import QUERY_NODE, { type AdminUserQuery } from './__generated__/AdminUserQuery.graphql';
import { AdminUserDetailRouteQuery, AdminUserEditRouteQuery, RouteName, type AdminUserEntryPointParams } from '../../routes/__generated__/routes';

export function AdminUserEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(AdminUser, { queryRef: queries.content }); }

export const ADMIN_USER_ENTRY_POINT: RouteEntryPoint<AdminUserEntryPointParams, Queries> = {
  root: resource('AdminUser', AdminUserEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: (route.currentRoute === RouteName.AdminUserDetail ? AdminUserDetailRouteQuery.getVariables(route.input) : AdminUserEditRouteQuery.getVariables(route.input)), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminUserQuery };
