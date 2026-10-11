import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPage } from './AdminPage';
import LIST_NODE, { type AdminPageListQuery } from './__generated__/AdminPageListQuery.graphql';
import QUERY_NODE, { type AdminPageQuery } from './__generated__/AdminPageQuery.graphql';
import CREATE_NODE, { type AdminPageCreateQuery } from './__generated__/AdminPageCreateQuery.graphql';
import { AdminPageListRouteQuery, AdminPageCreateRouteQuery, AdminPageDetailRouteQuery, AdminPageEditRouteQuery, RouteName, type AdminPageEntryPointParams } from '../../routes/__generated__/routes';

export function AdminPageEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(AdminPage, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_PAGE_ENTRY_POINT: RouteEntryPoint<AdminPageEntryPointParams, Queries> = {
  root: resource('AdminPage', AdminPageEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.AdminPageList
    ? { list: { parameters: LIST_NODE, variables: AdminPageListRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
    : route.currentRoute === RouteName.AdminPageCreate
      ? { create: { parameters: CREATE_NODE, variables: AdminPageCreateRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: (route.currentRoute === RouteName.AdminPageDetail ? AdminPageDetailRouteQuery.getVariables(route.input) : AdminPageEditRouteQuery.getVariables(route.input)), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminPageListQuery; create?: AdminPageCreateQuery; content?: AdminPageQuery };
