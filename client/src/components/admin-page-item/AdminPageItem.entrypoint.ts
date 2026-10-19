import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPageItem } from './AdminPageItem';
import LIST_NODE, { type AdminPageItemListQuery } from './__generated__/AdminPageItemListQuery.graphql';
import QUERY_NODE, { type AdminPageItemQuery } from './__generated__/AdminPageItemQuery.graphql';
import CREATE_NODE, { type AdminPageItemCreateQuery } from './__generated__/AdminPageItemCreateQuery.graphql';
import { AdminPageItemListRouteQuery, AdminPageItemCreateRouteQuery, AdminPageItemDetailRouteQuery, RouteName, type AdminPageItemEntryPointParams } from '../../routes/__generated__/routes';

export function AdminPageItemEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(AdminPageItem, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_PAGE_ITEM_ENTRY_POINT: RouteEntryPoint<AdminPageItemEntryPointParams, Queries> = {
  root: resource('AdminPageItem', AdminPageItemEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.AdminPageItemList
    ? { list: { parameters: LIST_NODE, variables: AdminPageItemListRouteQuery.getVariables(route.input) } }
    : route.currentRoute === RouteName.AdminPageItemCreate
      ? { create: { parameters: CREATE_NODE, variables: AdminPageItemCreateRouteQuery.getVariables(route.input) } }
      : { content: { parameters: QUERY_NODE, variables: AdminPageItemDetailRouteQuery.getVariables(route.input) } } }),
};

type Queries = { list?: AdminPageItemListQuery; create?: AdminPageItemCreateQuery; content?: AdminPageItemQuery };
