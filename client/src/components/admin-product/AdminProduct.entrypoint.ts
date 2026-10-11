import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminProduct } from './AdminProduct';
import LIST_NODE, { type AdminProductListQuery } from './__generated__/AdminProductListQuery.graphql';
import QUERY_NODE, { type AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import CREATE_NODE, { type AdminProductCreateQuery } from './__generated__/AdminProductCreateQuery.graphql';
import { AdminProductListRouteQuery, AdminProductCreateRouteQuery, AdminProductDetailRouteQuery, AdminProductEditRouteQuery, RouteName, type AdminProductEntryPointParams } from '../../routes/__generated__/routes';

export function AdminProductEntryPoint({ queries }: EntryPointProps<Queries>) { return createElement(AdminProduct, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_PRODUCT_ENTRY_POINT: RouteEntryPoint<AdminProductEntryPointParams, Queries> = {
  root: resource('AdminProduct', AdminProductEntryPoint),
  getPreloadProps: route => ({ queries: route.currentRoute === RouteName.AdminProductList
    ? { list: { parameters: LIST_NODE, variables: AdminProductListRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
    : route.currentRoute === RouteName.AdminProductCreate
      ? { create: { parameters: CREATE_NODE, variables: AdminProductCreateRouteQuery.getVariables(route.input), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: (route.currentRoute === RouteName.AdminProductDetail ? AdminProductDetailRouteQuery.getVariables(route.input) : AdminProductEditRouteQuery.getVariables(route.input)), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminProductListQuery; create?: AdminProductCreateQuery; content?: AdminProductQuery };
