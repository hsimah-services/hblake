import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminProduct } from './AdminProduct';
import { AdminProductQueryVariables } from './AdminProductQuery';
import QUERY_NODE, { type AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminProductEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminProduct, { queryRef: queries.content }); }

export const ADMIN_PRODUCT_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminProduct', AdminProductEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminProductQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminProductQuery };
type Empty = Record<string, never>;
