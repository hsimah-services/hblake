import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminProduct } from './AdminProduct';
import { AdminProductListQueryVariables } from './AdminProductListQuery';
import { AdminProductQueryVariables } from './AdminProductQuery';
import { AdminProductCreateQueryVariables } from './AdminProductCreateQuery';
import LIST_NODE, { type AdminProductListQuery } from './__generated__/AdminProductListQuery.graphql';
import QUERY_NODE, { type AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import CREATE_NODE, { type AdminProductCreateQuery } from './__generated__/AdminProductCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminProductEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminProduct, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_PRODUCT_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminProduct', AdminProductEntryPoint),
  getPreloadProps: route => ({ queries: route.mode === 'list'
    ? { list: { parameters: LIST_NODE, variables: AdminProductListQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
    : route.mode === 'create'
      ? { create: { parameters: CREATE_NODE, variables: AdminProductCreateQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: AdminProductQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminProductListQuery; create?: AdminProductCreateQuery; content?: AdminProductQuery };
type Empty = Record<string, never>;
