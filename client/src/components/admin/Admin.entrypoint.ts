import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Admin } from './Admin';
import QUERY_NODE, { type AdminQuery } from './__generated__/AdminQuery.graphql';
import { AdminHomeRouteQuery, type AdminEntryPointParams } from '../../routes/__generated__/routes';

export function AdminEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(Admin, { queryRef: queries.content }); }

export const ADMIN_ENTRY_POINT: RouteEntryPoint<AdminEntryPointParams, Queries> = {
  root: resource('Admin', AdminEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminHomeRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminQuery };
