import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPost } from './AdminPost';
import LIST_NODE, { type AdminPostListQuery } from './__generated__/AdminPostListQuery.graphql';
import QUERY_NODE, { type AdminPostQuery } from './__generated__/AdminPostQuery.graphql';
import CREATE_NODE, { type AdminPostCreateQuery } from './__generated__/AdminPostCreateQuery.graphql';
import { AdminPostListRouteQuery, AdminPostCreateRouteQuery, AdminPostDetailRouteQuery, AdminPostEditRouteQuery, RouteName, type AdminPostEntryPointParams } from '../../routes/__generated__/routes';

export function AdminPostEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(AdminPost, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_POST_ENTRY_POINT: RouteEntryPoint<AdminPostEntryPointParams, Queries> = {
  root: resource('AdminPost', AdminPostEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.AdminPostList
    ? { list: { parameters: LIST_NODE, variables: AdminPostListRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
    : route.currentRoute === RouteName.AdminPostCreate
      ? { create: { parameters: CREATE_NODE, variables: AdminPostCreateRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: (route.currentRoute === RouteName.AdminPostDetail ? AdminPostDetailRouteQuery.getVariables(route.input) : AdminPostEditRouteQuery.getVariables(route.input)), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminPostListQuery; create?: AdminPostCreateQuery; content?: AdminPostQuery };
